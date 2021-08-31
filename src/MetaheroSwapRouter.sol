// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./core/access/Owned.sol";
import "./core/erc20/IERC20.sol";
import "./core/lifecycle/Initializable.sol";
import "./core/math/SafeMathLib.sol";
import "./pancakeswap/PancakeLibrary.sol";
import "./pancakeswap/PancakeTransferHelper.sol";
import "./uniswapV2/IUniswapV2Pair.sol";
import "./uniswapV2/IUniswapV2Router02.sol";


/**
 * @title Metahero swap router
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
contract MetaheroSwapRouter is Owned, Initializable {
  using SafeMathLib for uint256;

  address public token;
  address public factory;
  address public native;

  mapping (address => bool) private supportedTokens;

  // events

  /**
   * @dev Emitted when the contract is initialized
   * @param token token address
   * @param factory factory address
   * @param native native address
   */
  event Initialized(
    address token,
    address factory,
    address native
  );

  /**
   * @dev Emitted when supported token is added
   * @param token token address
   */
  event SupportedTokenAdded(
    address token
  );

  /**
   * @dev Emitted when supported token is removed
   * @param token token address
   */
  event SupportedTokenRemoved(
    address token
  );

  /**
   * @dev Public constructor
   */
  constructor ()
    public
    Owned()
    Initializable()
  {
    //
  }

  // external functions

  /**
   * @dev Initializes the contract
   * @param token_ token address
   * @param router_ router address
   */
  function initialize(
    address token_,
    address router_
  )
    external
    onlyInitializer
  {
    require(
      token_ != address(0),
      "MetaheroSwapRouter#1" // token is the zero address
    );

    require(
      router_ != address(0),
      "MetaheroSwapRouter#2" // router is the zero address
    );

    IUniswapV2Router02 router = IUniswapV2Router02(router_);

    token = token_;
    factory = router.factory();
    native = router.WETH();

    emit Initialized(
      token_,
      factory,
      native
    );
  }

  /**
   * @dev Adds supported token
   * @param token_ token address
   */
  function addSupportedToken(
    address token_
  )
    external
    onlyOwner
  {
    _addSupportedToken(token_);
  }

  /**
   * @dev Adds supported tokens
   * @param tokens tokens array
   */
  function addSupportedTokens(
    address[] calldata tokens
  )
    external
    onlyOwner
  {
    uint len = tokens.length;

    require(
      len != 0,
      "MetaheroSwapRouter#3" // tokens list is empty
    );

    for (uint index; index < len; index++) {
      _addSupportedToken(tokens[index]);
    }
  }

  /**
   * @dev Removes supported tokens
   * @param token_ token address
   */
  function removeSupportedToken(
    address token_
  )
    external
    onlyOwner
  {
    _removeSupportedToken(token_);
  }

  /**
   * @dev Removes supported tokens
   * @param tokens tokens array
   */
  function removeSupportedTokens(
    address[] calldata tokens
  )
    external
    onlyOwner
  {
    uint len = tokens.length;

    require(
      len != 0,
      "MetaheroSwapRouter#4" // tokens list is empty
    );

    for (uint index; index < len; index++) {
      _removeSupportedToken(tokens[index]);
    }
  }

  function swapSupportedTokens(
    address supportedToken,
    uint256 amountIn,
    uint256 amountOutMin
  )
    external
  {
    require(
      supportedTokens[supportedToken],
      "MetaheroSwapRouter#5" // token is not supported
    );

    address[] memory path = new address[](3);

    path[0] = supportedToken;
    path[1] = native;
    path[2] = token;

    _swapExactTokensForTokensSupportingFeeOnTransferTokens(
      amountIn,
      amountOutMin,
      path,
      msg.sender
    );
  }

  // private functions

  function _addSupportedToken(
    address token_
  )
    private
  {
    require(
      token_ != address(0),
      "MetaheroSwapRouter#6" // token is the zero address
    );

    require(
      !supportedTokens[token_],
      "MetaheroSwapRouter#7" // token already supported
    );

    supportedTokens[token_] = true;

    emit SupportedTokenAdded(
      token_
    );
  }

  function _removeSupportedToken(
    address token_
  )
    private
  {
    require(
      supportedTokens[token_],
      "MetaheroSwapRouter#8" // token is not supported
    );

    supportedTokens[token_] = false;

    emit SupportedTokenRemoved(
      token_
    );
  }

  function _swapExactTokensForTokensSupportingFeeOnTransferTokens(
    uint amountIn,
    uint amountOutMin,
    address[] memory path,
    address to
  )
    private
  {
    PancakeTransferHelper.safeTransferFrom(
      path[0], msg.sender, PancakeLibrary.pairFor(factory, path[0], path[1]), amountIn
    );

    uint balanceBefore = IERC20(path[path.length - 1]).balanceOf(to);

    _swapSupportingFeeOnTransferTokens(path, to);

    require(
      IERC20(path[path.length - 1]).balanceOf(to).sub(balanceBefore) >= amountOutMin,
      "MetaheroSwapRouter#9"
    );
  }

  function _swapSupportingFeeOnTransferTokens(
    address[] memory path,
    address _to
  )
    private
  {
    for (uint i; i < path.length - 1; i++) {
      (address input, address output) = (path[i], path[i + 1]);

      (address token0,) = PancakeLibrary.sortTokens(input, output);

      IUniswapV2Pair pair = IUniswapV2Pair(PancakeLibrary.pairFor(factory, input, output));

      uint amountInput;
      uint amountOutput;

      {
        (uint reserve0, uint reserve1,) = pair.getReserves();
        (uint reserveInput, uint reserveOutput) = input == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
        amountInput = IERC20(input).balanceOf(address(pair)).sub(reserveInput);
        amountOutput = PancakeLibrary.getAmountOut(amountInput, reserveInput, reserveOutput);
      }

      (uint amount0Out, uint amount1Out) = input == token0 ? (uint(0), amountOutput) : (amountOutput, uint(0));

      address to = i < path.length - 2 ? PancakeLibrary.pairFor(factory, output, path[i + 2]) : _to;

      pair.swap(amount0Out, amount1Out, to, new bytes(0));
    }
  }
}
