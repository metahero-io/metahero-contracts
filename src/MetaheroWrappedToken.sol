// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "./core/erc20/ERC20.sol";
import "./core/lifecycle/Initializable.sol";
import "./core/math/SafeMathLib.sol";
import "./MetaheroToken.sol";


/**
 * @title Metahero wrapped token
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
contract MetaheroWrappedToken is ERC20, Initializable {
  using SafeMathLib for uint256;

  // metadata

  string private constant TOKEN_NAME = "Wrapped Metahero";
  string private constant TOKEN_SYMBOL = "WHERO";
  uint8 private constant TOKEN_DECIMALS = 18; // 0.000000000000000000

  /**
   * @return token address
   */
  MetaheroToken public token;

  /**
   * @return total supply
   */
  uint256 public override totalSupply;

  mapping (address => uint256) private balances;
  mapping (address => mapping (address => uint256)) private allowances;

  // events

  /**
   * @dev Emitted when the contract is initialized
   * @param token token address
   */
  event Initialized(
    address token
  );

  /**
   * @dev Public constructor
   */
  constructor ()
    public
    ERC20(TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DECIMALS) // sets metadata
    Initializable()
  {
    //
  }

  // external functions

  /**
   * @dev Initializes the contract
   * @param token_ token address
   */
  function initialize(
    address token_
  )
    external
    onlyInitializer
  {
    require(
      token_ != address(0),
      "MetaheroWrappedToken#1" // token is the zero address
    );

    token = MetaheroToken(token_);

    emit Initialized(
      token_
    );
  }

  /**
   * @dev Approve spending limit
   * @param spender spender address
   * @param amount spending limit
   */
  function approve(
    address spender,
    uint256 amount
  )
    external
    override
    returns (bool)
  {
    _approve(
      msg.sender,
      spender,
      amount
    );

    return true;
  }

  /**
   * @dev Transfers tokens
   * @param recipient recipient address
   * @param amount tokens amount
   */
  function transfer(
    address recipient,
    uint256 amount
  )
    external
    override
    returns (bool)
  {
    _transfer(
      msg.sender,
      recipient,
      amount
    );

    return true;
  }

  /**
   * @dev Transfers tokens from
   * @param sender sender address
   * @param recipient recipient address
   * @param amount tokens amount
   */
  function transferFrom(
    address sender,
    address recipient,
    uint256 amount
  )
    external
    override
    returns (bool)
  {
    _transfer(
      sender,
      recipient,
      amount
    );

    uint256 allowance = allowances[sender][msg.sender];

    require(
      allowance >= amount,
      "MetaheroWrappedToken#2"  // amount exceeds allowance
    );

    _approve( // update allowance
      sender,
      msg.sender,
      allowance.sub(amount)
    );

    return true;
  }

  /**
   * @dev Deposits tokens
   * @param amount tokens amount
   */
  function deposit(
    uint256 amount
  )
    external
    returns (bool)
  {
    _deposit(
      msg.sender,
      msg.sender,
      amount
    );

    return true;
  }

  /**
   * @dev Deposits tokens to recipient
   * @param recipient recipient address
   * @param amount tokens amount
   */
  function depositTo(
    address recipient,
    uint256 amount
  )
    external
    returns (bool)
  {
    _deposit(
      msg.sender,
      recipient,
      amount
    );

    return true;
  }

  /**
   * @dev Withdraws tokens
   * @param amount tokens amount
   */
  function withdraw(
    uint256 amount
  )
    external
    returns (bool)
  {
    _withdraw(
      msg.sender,
      msg.sender,
      amount
    );

    return true;
  }

  /**
   * @dev Withdraws tokens to recipient
   * @param recipient recipient address
   * @param amount tokens amount
   */
  function withdrawTo(
    address recipient,
    uint256 amount
  )
    external
    returns (bool)
  {
    _withdraw(
      msg.sender,
      recipient,
      amount
    );

    return true;
  }

  // external functions (views)

  /**
   * @dev Gets allowance
   * @param owner owner address
   * @param spender spender address
   * @return allowance
   */
  function allowance(
    address owner,
    address spender
  )
    external
    view
    override
    returns (uint256)
  {
    return allowances[owner][spender];
  }

  /**
   * @dev Gets balance of
   * @param account account address
   * @return result account balance
   */
  function balanceOf(
    address account
  )
    external
    view
    override
    returns (uint256)
  {
    return balances[account];
  }

  // private functions

  function _approve(
    address owner,
    address spender,
    uint256 amount
  )
    private
  {
    require(
      spender != address(0),
      "MetaheroWrappedToken#3" // spender is the zero address
    );

    allowances[owner][spender] = amount;

    emit Approval(
      owner,
      spender,
      amount
    );
  }

  function _transfer(
    address sender,
    address recipient,
    uint256 amount
  )
    private
  {
    require(
      sender != address(0),
      "MetaheroWrappedToken#4" // sender is the zero address
    );

    require(
      recipient != address(0),
      "MetaheroWrappedToken#5" // recipient is the zero address
    );

    require(
      amount != 0,
      "MetaheroWrappedToken#6" // amount is zero
    );

    require(
      balances[sender] >= amount,
      "MetaheroWrappedToken#7" // amount exceeds sender balance
    );

    balances[sender] = balances[sender].sub(amount);
    balances[recipient] = balances[recipient].add(amount);

    emit Transfer(
      sender,
      recipient,
      amount
    );
  }

  function _deposit(
    address sender,
    address recipient,
    uint256 amount
  )
    private
  {
    require(
      sender != address(0),
      "MetaheroWrappedToken#8" // sender is the zero address
    );

    require(
      recipient != address(0),
      "MetaheroWrappedToken#9" // recipient is the zero address
    );

    require(
      amount != 0,
      "MetaheroWrappedToken#10" // amount is zero
    );

    uint256 tokenBalance = token.balanceOf(address(this));

    token.transferFrom(sender, address(this), amount);

    amount = token.balanceOf(address(this)).sub(tokenBalance);

    require(
      amount != 0,
      "MetaheroWrappedToken#11" // amount is zero
    );

    balances[recipient] = balances[recipient].add(amount);
    totalSupply = totalSupply.add(amount);

    emit Transfer(
      address(0),
      recipient,
      amount
    );
  }

  function _withdraw(
    address sender,
    address recipient,
    uint256 amount
  )
    private
  {
    require(
      sender != address(0),
      "MetaheroWrappedToken#12" // sender is the zero address
    );

    require(
      recipient != address(0),
      "MetaheroWrappedToken#13" // recipient is the zero address
    );

    require(
      amount != 0,
      "MetaheroWrappedToken#14" // amount is zero
    );

    require(
      balances[sender] >= amount,
      "MetaheroWrappedToken#15" // amount exceeds sender balance
    );

    balances[sender] = balances[sender].sub(amount);
    totalSupply = totalSupply.sub(amount);

    emit Transfer(
      sender,
      address(0),
      amount
    );

    token.transfer(recipient, amount);
  }
}
