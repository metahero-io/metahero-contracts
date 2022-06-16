// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./core/erc20/IWrappedNative.sol";
import "./uniswapV2/IUniswapV2Factory.sol";
import "./uniswapV2/IUniswapV2Pair.sol";
import "./uniswapV2/IUniswapV2Router02.sol";
import "./MetaheroLPM.sol";

/**
 * @title Metahero liquidity pool manager for Uniswap v2
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
contract MetaheroLPMForUniswapV2 is MetaheroLPM {
  struct Settings {
    uint256 enableBurnLPAtValue; // value of the tokens that turned on the burnLP method
    address stableCoin; // stable coin address eg. BUSD, DAI
  }

  /**
   * @return settings object
   */
  Settings public settings;

  /**
   * @return Uniswap V2 factory address
   */
  IUniswapV2Factory public uniswapFactory;

  /**
   * @return Uniswap V2 pair address
   */
  IUniswapV2Pair public uniswapPair;

  /**
   * @return Uniswap V2 router02 address
   */
  IUniswapV2Router02 public uniswapRouter;

  IWrappedNative private wrappedNative;
  bool private correctPairOrder;

  // events

  /**
   * @dev Emitted the contract is initialized
   * @param enableBurnLPAtValue value of the tokens that turned on the burnLP method
   * @param stableCoin stable coin address eg. BUSD, DAI
   * @param token token address
   * @param uniswapRouter Uniswap V2 router02 address
   * @param uniswapPair Uniswap V2 pair address
   */
  event Initialized(
    uint256 enableBurnLPAtValue,
    address stableCoin,
    address token,
    address uniswapRouter,
    address uniswapPair
  );

  /**
   * @dev Public constructor
   */
  constructor() public MetaheroLPM() {
    //
  }

  // external functions

  /**
   * @dev Mints stable coins to the contract
   */
  receive() external payable {
    _deposit(msg.value);
  }

  /**
   * @dev Mints stable coins to the contract
   */
  function deposit() external payable {
    _deposit(msg.value);
  }

  /**
   * @dev Initializes the contract
   * @param enableBurnLPAtValue value of the tokens that turned on the burnLP method
   * @param stableCoin stable coin address eg. BUSD, DAI
   * @param token_ token address
   * @param uniswapRouter_ Uniswap V2 router02 address
   */
  function initialize(
    uint256 enableBurnLPAtValue,
    address stableCoin,
    address token_,
    address uniswapRouter_
  ) external onlyInitializer {
    _initialize(token_);

    if (enableBurnLPAtValue != 0) {
      require(
        stableCoin != address(0),
        "MetaheroLPMForUniswapV2#2" // stable coin is the zero address
      );

      settings.enableBurnLPAtValue = enableBurnLPAtValue;
      settings.stableCoin = stableCoin;
    }

    require(
      uniswapRouter_ != address(0),
      "MetaheroLPMForUniswapV2#3" // Uniswap V2 router02 is the zero address
    );

    uniswapRouter = IUniswapV2Router02(uniswapRouter_);
    uniswapFactory = IUniswapV2Factory(uniswapRouter.factory());

    wrappedNative = IWrappedNative(uniswapRouter.WETH());

    // create a pair
    uniswapPair = IUniswapV2Pair(
      uniswapFactory.createPair(address(token), address(wrappedNative))
    );

    correctPairOrder = address(token) < address(wrappedNative);

    emit Initialized(
      enableBurnLPAtValue,
      stableCoin,
      token_,
      uniswapRouter_,
      address(uniswapPair)
    );
  }

  // external functions (views)

  /**
   * @notice Checks when to sync the liquidity pool
   * @param sender sender address
   * @param recipient recipient address
   */
  function canSyncLP(address sender, address recipient)
    external
    view
    override
    returns (bool shouldSyncLPBefore, bool shouldSyncLPAfter)
  {
    if (sender != address(uniswapPair)) {
      // omit when swap HERO > BNB
      if (recipient == address(uniswapPair)) {
        shouldSyncLPBefore = true; // swap BNB > HERO
      } else {
        shouldSyncLPAfter = true;
      }
    }

    return (shouldSyncLPBefore, shouldSyncLPAfter);
  }

  // internal functions

  function _syncLP() internal override {
    uint256 totalAmount = token.balanceOf(address(this));

    if (totalAmount >= 2) {
      uint256 swapAmount = totalAmount.div(2);
      uint256 liquidityAmount = totalAmount.sub(swapAmount);

      // swap half for native
      _swapTokens(swapAmount);

      // add other half with received native
      _addTokensToLiquidity(liquidityAmount);
    }
  }

  function _burnLP(uint256 amount) internal override {
    if (settings.enableBurnLPAtValue != 0) {
      (uint256 tokenReserve, ) = _getLiquidityReserves();

      require(
        tokenReserve != 0,
        "MetaheroLPMForUniswapV2#4" // token reserve is zero
      );

      require(
        amount <= tokenReserve,
        "MetaheroLPMForUniswapV2#5" // amount higher than token reserve
      );

      uint256 tokenReserveValue = _calcTokensValue(tokenReserve);

      require(
        tokenReserveValue > settings.enableBurnLPAtValue,
        "MetaheroLPMForUniswapV2#6" // burnLP disabled
      );

      uint256 amountValue = _calcTokensValue(amount);
      uint256 maxAmountValue = tokenReserveValue.sub(
        settings.enableBurnLPAtValue
      );

      require(
        amountValue <= maxAmountValue,
        "MetaheroLPMForUniswapV2#7" // amount is too high
      );
    }

    // remove liquidity
    _removeLiquidity();

    uint256 totalAmount = token.balanceOf(address(this));

    require(
      totalAmount >= amount,
      "MetaheroLPMForUniswapV2#8" // amount is too high
    );

    token.burn(amount); // burn tokens

    _addTokensToLiquidity(totalAmount.sub(amount)); // adds others to liquidity
  }

  // private functions

  function _deposit(uint256 amount) private {
    require(
      amount != 0,
      "MetaheroLPMForUniswapV2#1" // amount is zero
    );

    wrappedNative.deposit{value: amount}();
  }

  function _swapTokens(uint256 amount) private {
    token.approve(address(uniswapRouter), amount);

    address[] memory path = new address[](2);

    path[0] = address(token);
    path[1] = address(wrappedNative);

    // omit revert, let's use those tokens on the next swap
    try
      uniswapRouter.swapExactTokensForTokens(
        amount,
        0,
        path,
        address(this),
        block.timestamp // solhint-disable-line not-rely-on-time
      )
    {
      //
    } catch {
      //
    }
  }

  function _addTokensToLiquidity(uint256 tokensAmount) private {
    uint256 wrappedNativeAmount = wrappedNative.balanceOf(address(this));

    if (tokensAmount != 0 && wrappedNativeAmount != 0) {
      token.approve(address(uniswapRouter), tokensAmount);

      wrappedNative.approve(address(uniswapRouter), wrappedNativeAmount);

      // omit revert, let's use those tokens on the next swap
      try
        uniswapRouter.addLiquidity(
          address(token),
          address(wrappedNative),
          tokensAmount,
          wrappedNativeAmount,
          0,
          0,
          address(this),
          block.timestamp // solhint-disable-line not-rely-on-time
        )
      {
        //
      } catch {
        //
      }
    }
  }

  function _removeLiquidity() private {
    uint256 liquidity = uniswapPair.balanceOf(address(this));

    if (liquidity != 0) {
      uniswapPair.approve(address(uniswapRouter), liquidity);

      uniswapRouter.removeLiquidity(
        address(token),
        address(wrappedNative),
        liquidity,
        0,
        0,
        address(this),
        block.timestamp // solhint-disable-line not-rely-on-time
      );
    }
  }

  // private functions (views)

  function _calcTokensValue(uint256 amount) private view returns (uint256) {
    address[] memory path = new address[](3);

    path[0] = address(token);
    path[1] = address(wrappedNative);
    path[2] = settings.stableCoin;

    uint256[] memory amounts = uniswapRouter.getAmountsOut(amount, path);

    return amounts[2];
  }

  function _getLiquidityReserves()
    private
    view
    returns (uint256 tokenReserve, uint256 wrappedNativeReserve)
  {
    (uint112 reserve0, uint112 reserve1, ) = uniswapPair.getReserves();

    (tokenReserve, wrappedNativeReserve) = correctPairOrder
      ? (reserve0, reserve1)
      : (reserve1, reserve0);

    return (tokenReserve, wrappedNativeReserve);
  }
}
