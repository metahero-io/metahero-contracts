// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./erc20/WrappedNative.sol";
import "./uniswapV2/UniswapV2Factory.sol";
import "./uniswapV2/UniswapV2Pair.sol";
import "./uniswapV2/UniswapV2Router02.sol";
import "./HEROLPManager.sol";


/**
 * @title HERO liquidity pool manager for Uniswap v2
 */
contract HEROLPManagerForUniswapV2 is HEROLPManager {
  struct Settings {
    uint256 enableBurnLPAtValue;
    address stableCoin;
  }

  Settings public settings;
  UniswapV2Factory public uniswapFactory;
  UniswapV2Pair public uniswapPair;
  UniswapV2Router02 public uniswapRouter;

  WrappedNative private wrappedNative;
  bool private correctPairOrder;

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

  receive()
    external
    payable
  {
    require(
      msg.value != 0,
      "HEROLPManagerUniswapV2#1"
    );

    wrappedNative.deposit{value: msg.value}();
  }

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
        "HEROLPManagerUniswapV2#2"
      );

      settings.enableBurnLPAtValue = enableBurnLPAtValue;
      settings.stableCoin = stableCoin;
    }

    require(
      uniswapRouter_ != address(0),
      "HEROLPManagerUniswapV2#3"
    );

    uniswapRouter = UniswapV2Router02(uniswapRouter_);
    uniswapFactory = UniswapV2Factory(uniswapRouter.factory());

    wrappedNative = WrappedNative(uniswapRouter.WETH());

    uniswapPair = UniswapV2Pair(uniswapFactory.createPair(
      address(token),
      address(wrappedNative)
    ));

    correctPairOrder = address(token) < address(wrappedNative);
  }

  // external functions (views)

  function canSyncLP(
    address sender,
    address recipient
  )
    external
    view
    override
    returns (
      bool shouldSyncLPBefore,
      bool shouldSyncLPAfter
    )
  {
    if (sender != address(uniswapPair)) {
      if (recipient == address(uniswapPair)) {
        shouldSyncLPBefore = true;
      } else {
        shouldSyncLPAfter = true;
      }
    }

    return (shouldSyncLPBefore, shouldSyncLPAfter);
  }

  // internal functions

  function _syncLP()
    internal
    override
  {
    uint256 totalAmount = token.balanceOf(address(this));

    if (totalAmount != 0) {
      uint256 swapAmount = totalAmount.div(2);
      uint256 liquidityAmount = totalAmount.sub(swapAmount);

      _swapTokens(swapAmount);

      _addTokensToLiquidity(liquidityAmount);
    }
  }

  function _burnLP(
    uint256 amount
  )
    internal
    override
  {
    if (settings.enableBurnLPAtValue != 0) {
      (uint256 tokenReserve, ) = _getLiquidityReserves();

      require(
        tokenReserve != 0,
        "HEROLPManagerUniswapV2#4"
      );

      require(
        amount <= tokenReserve,
        "HEROLPManagerUniswapV2#5"
      );

      address[] memory path = new address[](3);

      path[0] = address(token);
      path[1] = address(wrappedNative);
      path[2] = settings.stableCoin;

      uint256[] memory amounts = uniswapRouter.getAmountsOut(amount, path);

      uint256 tokensValue = amounts[2];

      require(
        tokensValue > settings.enableBurnLPAtValue,
        "HEROLPManagerUniswapV2#6"
      );

      uint256 amountValue = amount.mul(tokensValue).div(amount);
      uint256 maxValue = tokensValue.div(settings.enableBurnLPAtValue);

      require(
        maxValue >= amountValue,
        "HEROLPManagerUniswapV2#7"
      );
    }

    _removeLiquidity();

    uint256 totalAmount = token.balanceOf(address(this));

    require(
      totalAmount >= amount,
      "HEROLPManagerUniswapV2#8"
    );

    token.burn(amount);

    _addTokensToLiquidity(
      totalAmount.sub(amount)
    );
  }

  function _swapTokens(
    uint256 amount
  )
    private
  {
    if (amount != 0) {
      token.approve(
        address(uniswapRouter),
        amount
      );

      address[] memory path = new address[](2);

      path[0] = address(token);
      path[1] = address(wrappedNative);

      uniswapRouter.swapExactTokensForTokens(
        amount,
        0,
        path,
        address(this),
        block.timestamp // solhint-disable-line not-rely-on-time
      );
    }
  }

  function _addTokensToLiquidity(
    uint256 tokensAmount
  )
    private
  {
    uint256 wrappedNativeAmount = wrappedNative.balanceOf(address(this));

    if (
      tokensAmount != 0 &&
      wrappedNativeAmount != 0
    ) {
      token.approve(
        address(uniswapRouter),
        tokensAmount
      );

      wrappedNative.approve(
        address(uniswapRouter),
        wrappedNativeAmount
      );

      (
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired
      ) = correctPairOrder
        ? (address(token), address(wrappedNative), tokensAmount, wrappedNativeAmount)
        : (address(wrappedNative), address(token), wrappedNativeAmount, tokensAmount);

      uniswapRouter.addLiquidity(
        tokenA,
        tokenB,
        amountADesired,
        amountBDesired,
        0,
        0,
        address(this),
        block.timestamp // solhint-disable-line not-rely-on-time
      );
    }
  }

  function _removeLiquidity()
    private
  {
    uint256 liquidity = uniswapPair.balanceOf(address(this));

    if (liquidity != 0) {
      uniswapPair.approve(
        address(uniswapRouter),
        liquidity
      );

      (
        address tokenA,
        address tokenB
      ) = correctPairOrder
        ? (address(token), address(wrappedNative))
        : (address(wrappedNative), address(token));

      uniswapRouter.removeLiquidity(
        tokenA,
        tokenB,
        liquidity,
        0,
        0,
        address(this),
        block.timestamp // solhint-disable-line not-rely-on-time
      );
    }
  }

  // private functions (views)

  function _getLiquidityReserves()
    private
    view
    returns (
      uint256 tokenReserve,
      uint256 wrappedNativeReserve
    )
  {
    (
      uint112 reserve0,
      uint112 reserve1,
    ) = uniswapPair.getReserves();

    (tokenReserve, wrappedNativeReserve) = correctPairOrder
      ? (reserve0, reserve1)
      : (reserve1, reserve0);

    return (tokenReserve, wrappedNativeReserve);
  }
}
