// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./external/UniswapV2Factory.sol";
import "./external/UniswapV2Pair.sol";
import "./external/UniswapV2Router02.sol";
import "./HEROTokenEconomy.sol";


/**
 * @title HERO token liquidity pool module
 */
contract HEROTokenLP is HEROTokenEconomy {
  // defaults

  uint256 private constant DEFAULT_ENABLE_BURN_LP_AT_VALUE = 10000000 * 10 ** 18; // 10,000,000.000000000000000000

  UniswapV2Factory public swapFactory;
  UniswapV2Router02 public swapRouter;
  UniswapV2Pair public swapPair;
  address public stableCoin;

  address private wrappedNative;
  bool private swapLocked;

  // modifiers

  modifier lockSwap() {
    if (!swapLocked) {
      swapLocked = true;

      _;

      swapLocked = false;
    }
  }

  /**
   * @dev Internal constructor
   */
  constructor ()
    internal
    HEROTokenEconomy()
  {
    //
  }

  // external functions

  receive()
    external
    payable
  {
    //
  }

  function burnLP(
    uint256 amount
  )
    external
    onlyController
    lockSwap
  {
    require(
      amount > 1,
      "HEROTokenLP#1"
    );

    (uint256 tokenAmount, ) = _getLiquidityReserves();

    require(
      tokenAmount != 0,
      "HEROTokenLP#2"
    );

    require(
      amount <= tokenAmount,
      "HEROTokenLP#3"
    );

    address[] memory path = new address[](3);

    path[0] = address(this);
    path[1] = wrappedNative;
    path[2] = stableCoin;

    uint256[] memory amounts = swapRouter.getAmountsOut(amount, path);

    uint256 tokensValue = amounts[2];

    require(
      tokensValue > settings.enableBurnLPAtValue,
      "HEROTokenLP#4"
    );

    uint256 amountValue = amount.mul(tokensValue).div(tokenAmount);
    uint256 maxValue = tokensValue.div(settings.enableBurnLPAtValue);

    require(
      maxValue >= amountValue,
      "HEROTokenLP#5"
    );

    (tokenAmount, ) = _removeLiquidity(
      swapPair.balanceOf(address(this))
    );

    _burn(
      address(this),
      amount
    );

    _addLiquidity(
      tokenAmount.add(amount),
      address(this).balance
    );
  }

  // internal functions

  function _initializeLP(
    uint256 enableBurnLPAtValue,
    address swapRouter_,
    address stableCoin_
  )
    internal
  {
    require(
      swapRouter_ != address(0),
      "HEROTokenLP#6"
    );

    require(
      stableCoin_ != address(0),
      "HEROTokenLP#7"
    );

    settings.enableBurnLPAtValue = enableBurnLPAtValue == 0
      ? DEFAULT_ENABLE_BURN_LP_AT_VALUE
      : enableBurnLPAtValue;

    swapRouter = UniswapV2Router02(swapRouter_);
    swapFactory = UniswapV2Factory(swapRouter.factory());

    wrappedNative = swapRouter.WETH();

    swapPair = UniswapV2Pair(swapFactory.createPair(
      address(this),
      wrappedNative
    ));

    stableCoin = stableCoin_;

    _excludeAccount(address(swapRouter), true);
    _excludeAccount(address(swapPair), true);
  }

  function _increaseTotalLP(
    uint256 amount
  )
    internal
    override
  {
    HEROTokenEconomy._increaseTotalLP(amount);

    _swapTokensAndAddLiquidity();
  }

  // private functions

  function _swapTokensAndAddLiquidity()
    private
    lockSwap
  {
    uint256 tokensAmount = accountBalances[address(this)];
    uint256 nativeAmount = address(this).balance;

    uint256 half = tokensAmount.div(2);
    uint256 otherHalf = tokensAmount.sub(half);

    _swapTokens(half);

    _addLiquidity(
      otherHalf,
      nativeAmount
    );
  }

  function _swapTokens(
    uint256 tokenAmount
  )
    private
  {
    if (tokenAmount != 0) {
      _approve(
        address(this),
        address(swapRouter),
        tokenAmount
      );

      address[] memory path = new address[](2);

      path[0] = address(this);
      path[1] = wrappedNative;

      swapRouter.swapExactTokensForETHSupportingFeeOnTransferTokens(
        tokenAmount,
        0,
        path,
        address(this),
        block.timestamp // solhint-disable-line not-rely-on-time
      );
    }
  }

  function _addLiquidity(
    uint256 tokenAmount,
    uint256 nativeAmount
  )
    private
  {
    if (tokenAmount != 0 && nativeAmount != 0) {
      _approve(
        address(this),
        address(swapRouter),
        tokenAmount
      );

      swapRouter.addLiquidityETH{value : nativeAmount}(
        address(this),
        tokenAmount,
        0,
        0,
        address(this),
        block.timestamp // solhint-disable-line not-rely-on-time
      );
    }
  }

  function _removeLiquidity(
    uint256 liquidity
  )
    private
    returns (
      uint256 tokenAmount,
      uint256 nativeAmount
    )
  {
    swapPair.approve(
      address(swapRouter),
      liquidity
    );

    return swapRouter.removeLiquidityETH(
      address(this),
      liquidity,
      0,
      0,
      address(this),
      block.timestamp // solhint-disable-line not-rely-on-time
    );
  }

  // private functions (views)

  function _getLiquidityReserves()
    private
    view
    returns (
      uint256 tokenAmount,
      uint256 nativeAmount
    )
  {
    (
      uint112 reserve0,
      uint112 reserve1,
    )= swapPair.getReserves();

    (tokenAmount, nativeAmount) = address(this) < wrappedNative
      ? (reserve0, reserve1)
      : (reserve1, reserve0);

    return (tokenAmount, nativeAmount);
  }


}
