// SPDX-License-Identifier: GPL-3.0
/* solhint-disable */
pragma solidity ^0.6.12;

import '../core/erc20/IERC20.sol';
import '../core/math/SafeMathLib.sol';
import '../uniswapV2/IUniswapV2Factory.sol';
import '../uniswapV2/IUniswapV2Pair.sol';
import './IPancakeCallee.sol';
import './PancakeMath.sol';
import './PancakeUQ112x112.sol';


/**
 * @title Pancake pair
 *
 * @notice Based on https://github.com/pancakeswap/pancake-swap-core/blob/3b214306770e86bc3a64e67c2b5bdb566b4e94a7/contracts/PancakePair.sol
 */
contract PancakePair is IUniswapV2Pair {
  using SafeMathLib for uint;
  using PancakeUQ112x112 for uint224;

  uint public constant override MINIMUM_LIQUIDITY = 10 ** 3;
  bytes32 public constant override PERMIT_TYPEHASH = 0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9; // keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");

  bytes32 public override DOMAIN_SEPARATOR;

  string public override name = 'Pancake LPs';
  string public override symbol = 'Cake-LP';
  uint8 public override decimals = 18;
  uint public override totalSupply;

  mapping(address => uint) public override balanceOf;
  mapping(address => mapping(address => uint)) public override allowance;
  mapping(address => uint) public override nonces;

  address public override factory;
  address public override token0;
  address public override token1;

  uint public override price0CumulativeLast;
  uint public override price1CumulativeLast;
  uint public override kLast;

  bytes4 private constant SELECTOR = bytes4(keccak256(bytes('transfer(address,uint256)')));

  uint112 private reserve0;
  uint112 private reserve1;
  uint32 private blockTimestampLast;
  uint private unlocked = 1;

  // modifiers

  modifier lock() {
    require(unlocked == 1, 'Pancake: LOCKED');
    unlocked = 0;
    _;
    unlocked = 1;
  }

  // events

  event Mint(
    address indexed sender,
    uint amount0,
    uint amount1
  );

  event Burn(
    address indexed sender,
    uint amount0,
    uint amount1,
    address indexed to
  );

  event Swap(
    address indexed sender,
    uint amount0In,
    uint amount1In,
    uint amount0Out,
    uint amount1Out,
    address indexed to
  );

  event Sync(
    uint112 reserve0,
    uint112 reserve1
  );

  constructor()
    public
  {
    factory = msg.sender;

    uint chainId;

    assembly {
      chainId := chainid()
    }

    DOMAIN_SEPARATOR = keccak256(
      abi.encode(
        keccak256('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'),
        keccak256(bytes(name)),
        keccak256(bytes('1')),
        chainId,
        address(this)
      )
    );
  }

  // external functions

  function initialize(
    address _token0,
    address _token1
  )
    external
    override
  {
    require(msg.sender == factory, 'Pancake: FORBIDDEN');
    // sufficient check
    token0 = _token0;
    token1 = _token1;
  }

  function approve(
    address spender,
    uint value
  )
    external
    override
    returns (bool)
  {
    _approve(msg.sender, spender, value);
    return true;
  }

  function transfer(address to, uint value)
    external
    override
    returns (bool)
  {
    _transfer(msg.sender, to, value);
    return true;
  }

  function transferFrom(
    address from,
    address to,
    uint value
  )
    external
    override
    returns (bool)
  {
    if (allowance[from][msg.sender] != uint(- 1)) {
      allowance[from][msg.sender] = allowance[from][msg.sender].sub(value);
    }
    _transfer(from, to, value);
    return true;
  }

  function permit(
    address owner,
    address spender,
    uint value,
    uint deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  )
    external
    override
  {
    require(deadline >= block.timestamp, 'Pancake: EXPIRED');
    bytes32 digest = keccak256(
      abi.encodePacked(
        '\x19\x01',
        DOMAIN_SEPARATOR,
        keccak256(abi.encode(PERMIT_TYPEHASH, owner, spender, value, nonces[owner]++, deadline))
      )
    );
    address recoveredAddress = ecrecover(digest, v, r, s);
    require(recoveredAddress != address(0) && recoveredAddress == owner, 'Pancake: INVALID_SIGNATURE');
    _approve(owner, spender, value);
  }

  function mint(
    address to
  )
    external
    override
    lock
    returns (uint liquidity)
  {
    (uint112 _reserve0, uint112 _reserve1,) = getReserves();
    // gas savings
    uint balance0 = IERC20(token0).balanceOf(address(this));
    uint balance1 = IERC20(token1).balanceOf(address(this));
    uint amount0 = balance0.sub(_reserve0);
    uint amount1 = balance1.sub(_reserve1);

    bool feeOn = _mintFee(_reserve0, _reserve1);
    uint _totalSupply = totalSupply;
    // gas savings, must be defined here since totalSupply can update in _mintFee
    if (_totalSupply == 0) {
      liquidity = PancakeMath.sqrt(amount0.mul(amount1)).sub(MINIMUM_LIQUIDITY);
      _mint(address(0), MINIMUM_LIQUIDITY);
      // permanently lock the first MINIMUM_LIQUIDITY tokens
    } else {
      liquidity = PancakeMath.min(amount0.mul(_totalSupply) / _reserve0, amount1.mul(_totalSupply) / _reserve1);
    }
    require(liquidity > 0, 'Pancake: INSUFFICIENT_LIQUIDITY_MINTED');
    _mint(to, liquidity);

    _update(balance0, balance1, _reserve0, _reserve1);
    if (feeOn) kLast = uint(reserve0).mul(reserve1);
    // reserve0 and reserve1 are up-to-date
    emit Mint(msg.sender, amount0, amount1);
  }

  function burn(
    address to
  )
    external
    override
    lock
    returns (uint amount0, uint amount1)
  {
    (uint112 _reserve0, uint112 _reserve1,) = getReserves();
    // gas savings
    address _token0 = token0;
    // gas savings
    address _token1 = token1;
    // gas savings
    uint balance0 = IERC20(_token0).balanceOf(address(this));
    uint balance1 = IERC20(_token1).balanceOf(address(this));
    uint liquidity = balanceOf[address(this)];

    bool feeOn = _mintFee(_reserve0, _reserve1);
    uint _totalSupply = totalSupply;
    // gas savings, must be defined here since totalSupply can update in _mintFee
    amount0 = liquidity.mul(balance0) / _totalSupply;
    // using balances ensures pro-rata distribution
    amount1 = liquidity.mul(balance1) / _totalSupply;
    // using balances ensures pro-rata distribution
    require(amount0 > 0 && amount1 > 0, 'Pancake: INSUFFICIENT_LIQUIDITY_BURNED');
    _burn(address(this), liquidity);
    _safeTransfer(_token0, to, amount0);
    _safeTransfer(_token1, to, amount1);
    balance0 = IERC20(_token0).balanceOf(address(this));
    balance1 = IERC20(_token1).balanceOf(address(this));

    _update(balance0, balance1, _reserve0, _reserve1);
    if (feeOn) kLast = uint(reserve0).mul(reserve1);
    // reserve0 and reserve1 are up-to-date
    emit Burn(msg.sender, amount0, amount1, to);
  }

  function swap(
    uint amount0Out,
    uint amount1Out,
    address to,
    bytes calldata data
  )
    external
    override
    lock
  {
    require(amount0Out > 0 || amount1Out > 0, 'Pancake: INSUFFICIENT_OUTPUT_AMOUNT');
    (uint112 _reserve0, uint112 _reserve1,) = getReserves();
    // gas savings
    require(amount0Out < _reserve0 && amount1Out < _reserve1, 'Pancake: INSUFFICIENT_LIQUIDITY');

    uint balance0;
    uint balance1;
    {// scope for _token{0,1}, avoids stack too deep errors
      address _token0 = token0;
      address _token1 = token1;
      require(to != _token0 && to != _token1, 'Pancake: INVALID_TO');
      if (amount0Out > 0) _safeTransfer(_token0, to, amount0Out);
      // optimistically transfer tokens
      if (amount1Out > 0) _safeTransfer(_token1, to, amount1Out);
      // optimistically transfer tokens
      if (data.length > 0) IPancakeCallee(to).pancakeCall(msg.sender, amount0Out, amount1Out, data);
      balance0 = IERC20(_token0).balanceOf(address(this));
      balance1 = IERC20(_token1).balanceOf(address(this));
    }
    uint amount0In = balance0 > _reserve0 - amount0Out ? balance0 - (_reserve0 - amount0Out) : 0;
    uint amount1In = balance1 > _reserve1 - amount1Out ? balance1 - (_reserve1 - amount1Out) : 0;
    require(amount0In > 0 || amount1In > 0, 'Pancake: INSUFFICIENT_INPUT_AMOUNT');
    {// scope for reserve{0,1}Adjusted, avoids stack too deep errors
      uint balance0Adjusted = balance0.mul(1000).sub(amount0In.mul(2));
      uint balance1Adjusted = balance1.mul(1000).sub(amount1In.mul(2));
      require(balance0Adjusted.mul(balance1Adjusted) >= uint(_reserve0).mul(_reserve1).mul(1000 ** 2), 'Pancake: K');
    }

    _update(balance0, balance1, _reserve0, _reserve1);
    emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);
  }

  function skim(
    address to
  )
    external
    override
    lock
  {
    address _token0 = token0;
    // gas savings
    address _token1 = token1;
    // gas savings
    _safeTransfer(_token0, to, IERC20(_token0).balanceOf(address(this)).sub(reserve0));
    _safeTransfer(_token1, to, IERC20(_token1).balanceOf(address(this)).sub(reserve1));
  }

  function sync()
    external
    override
    lock
  {
    _update(IERC20(token0).balanceOf(address(this)), IERC20(token1).balanceOf(address(this)), reserve0, reserve1);
  }

  // public functions (views)

  function getReserves()
    public
    override
    view
    returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast)
  {
    _reserve0 = reserve0;
    _reserve1 = reserve1;
    _blockTimestampLast = blockTimestampLast;
  }

  // private functions

  function _mint(
    address to,
    uint value
  )
    private
  {
    totalSupply = totalSupply.add(value);
    balanceOf[to] = balanceOf[to].add(value);
    emit Transfer(address(0), to, value);
  }

  function _burn(
    address from,
    uint value
  )
    private
  {
    balanceOf[from] = balanceOf[from].sub(value);
    totalSupply = totalSupply.sub(value);
    emit Transfer(from, address(0), value);
  }

  function _approve(
    address owner,
    address spender,
    uint value
  )
    private
  {
    allowance[owner][spender] = value;
    emit Approval(owner, spender, value);
  }

  function _transfer(
    address from,
    address to,
    uint value
  )
    private
  {
    balanceOf[from] = balanceOf[from].sub(value);
    balanceOf[to] = balanceOf[to].add(value);
    emit Transfer(from, to, value);
  }

  function _safeTransfer(
    address token,
    address to,
    uint value
  )
    private
  {
    (bool success, bytes memory data) = token.call(abi.encodeWithSelector(SELECTOR, to, value));
    require(success && (data.length == 0 || abi.decode(data, (bool))), 'Pancake: TRANSFER_FAILED');
  }

  function _update(
    uint balance0,
    uint balance1,
    uint112 _reserve0,
    uint112 _reserve1
  )
    private
  {
    require(balance0 <= uint112(- 1) && balance1 <= uint112(- 1), 'Pancake: OVERFLOW');
    uint32 blockTimestamp = uint32(block.timestamp % 2 ** 32);
    uint32 timeElapsed = blockTimestamp - blockTimestampLast;
    // overflow is desired
    if (timeElapsed > 0 && _reserve0 != 0 && _reserve1 != 0) {
      // * never overflows, and + overflow is desired
      price0CumulativeLast += uint(PancakeUQ112x112.encode(_reserve1).uqdiv(_reserve0)) * timeElapsed;
      price1CumulativeLast += uint(PancakeUQ112x112.encode(_reserve0).uqdiv(_reserve1)) * timeElapsed;
    }
    reserve0 = uint112(balance0);
    reserve1 = uint112(balance1);
    blockTimestampLast = blockTimestamp;
    emit Sync(reserve0, reserve1);
  }

  function _mintFee(
    uint112 _reserve0,
    uint112 _reserve1
  )
    private
    returns (bool feeOn)
  {
    address feeTo = IUniswapV2Factory(factory).feeTo();
    feeOn = feeTo != address(0);
    uint _kLast = kLast;
    // gas savings
    if (feeOn) {
      if (_kLast != 0) {
        uint rootK = PancakeMath.sqrt(uint(_reserve0).mul(_reserve1));
        uint rootKLast = PancakeMath.sqrt(_kLast);
        if (rootK > rootKLast) {
          uint numerator = totalSupply.mul(rootK.sub(rootKLast));
          uint denominator = rootK.mul(3).add(rootKLast);
          uint liquidity = numerator / denominator;
          if (liquidity > 0) _mint(feeTo, liquidity);
        }
      }
    } else if (_kLast != 0) {
      kLast = 0;
    }
  }
}
