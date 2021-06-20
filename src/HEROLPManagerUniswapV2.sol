// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./uniswap/UniswapV2Factory.sol";
import "./uniswap/UniswapV2Pair.sol";
import "./uniswap/UniswapV2Router02.sol";
import "./HEROLPManager.sol";


/**
 * @title HERO liquidity pool manager for Uniswap V2
 */
contract HEROLPManagerUniswapV2 is HEROLPManager {
  struct Settings {
    uint256 enableBurnLPAtValue;
    address stableCoin;
  }

  Settings public settings;
  UniswapV2Factory public uniswapFactory;
  UniswapV2Pair public uniswapTokenPair;
  UniswapV2Router02 public uniswapRouter;

  address private wrappedNative;

  /**
   * @dev Public constructor
   */
  constructor ()
    public
    HEROLPManager()
  {
    //
  }

  // external functions

  function initialize(
    uint256 enableBurnLPAtValue,
    address stableCoin,
    address token_,
    address uniswapRouter_
  )
    external
    onlyInitializer
  {
    _initialize(token_);

    if (enableBurnLPAtValue != 0) {
      require(
        stableCoin != address(0),
        "HEROLPManagerUniswapV2#1"
      );

      settings.enableBurnLPAtValue = enableBurnLPAtValue;
      settings.stableCoin = stableCoin;
    }

    require(
      uniswapRouter_ != address(0),
      "HEROLPManagerUniswapV2#2"
    );

    uniswapRouter = UniswapV2Router02(uniswapRouter_);
    uniswapFactory = UniswapV2Factory(uniswapRouter.factory());

    wrappedNative = uniswapRouter.WETH();

    uniswapTokenPair = UniswapV2Pair(uniswapFactory.createPair(
      address(token),
      wrappedNative
    ));
  }

  // internal functions

  function _syncLP()
    internal
    override
  {
    uint256 tokensAmount = token.balanceOf(address(this));
    uint256 nativeAmount = address(this).balance;

    if (tokensAmount != 0 && nativeAmount != 0) {
      uint256 half = tokensAmount.div(2);
      uint256 otherHalf = tokensAmount.sub(half);

      _swapTokensForNative(half);

      _addLiquidity(
        otherHalf,
        nativeAmount
      );
    }
  }

  function _burnLP(
    uint256 amount
  )
    internal
    override
  {
    uint256 tokenAmount;

    if (settings.enableBurnLPAtValue != 0) {
      (tokenAmount, ) = _getLiquidityReserves();

      require(
        tokenAmount != 0,
        "HEROLPManagerUniswapV2#3"
      );

      require(
        amount <= tokenAmount,
        "HEROLPManagerUniswapV2#4"
      );

      address[] memory path = new address[](3);

      path[0] = address(token);
      path[1] = wrappedNative;
      path[2] = settings.stableCoin;

      uint256[] memory amounts = uniswapRouter.getAmountsOut(amount, path);

      uint256 tokensValue = amounts[2];

      require(
        tokensValue > settings.enableBurnLPAtValue,
        "HEROLPManagerUniswapV2#5"
      );

      uint256 amountValue = amount.mul(tokensValue).div(tokenAmount);
      uint256 maxValue = tokensValue.div(settings.enableBurnLPAtValue);

      require(
        maxValue >= amountValue,
        "HEROLPManagerUniswapV2#6"
      );
    }

    (tokenAmount, ) = _removeLiquidity(
      uniswapTokenPair.balanceOf(address(this))
    );

    require(
      tokenAmount >= amount,
      "HEROLPManagerUniswapV2#7"
    );

    token.burn(amount);

    _addLiquidity(
      token.balanceOf(address(this)),
      address(this).balance
    );
  }

  function _swapTokensForNative(
    uint256 tokenAmount
  )
    private
  {
    if (tokenAmount != 0) {
      token.approve(
        address(uniswapRouter),
        tokenAmount
      );

      address[] memory path = new address[](2);

      path[0] = address(token);
      path[1] = wrappedNative;

      uniswapRouter.swapExactTokensForETHSupportingFeeOnTransferTokens(
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
      token.approve(
        address(uniswapRouter),
        tokenAmount
      );

      uniswapRouter.addLiquidityETH{value : nativeAmount}(
        address(token),
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
    uniswapTokenPair.approve(
      address(uniswapRouter),
      liquidity
    );

    return uniswapRouter.removeLiquidityETH(
      address(token),
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
    )= uniswapTokenPair.getReserves();

    (tokenAmount, nativeAmount) = address(token) < wrappedNative
      ? (reserve0, reserve1)
      : (reserve1, reserve0);

    return (tokenAmount, nativeAmount);
  }
}
