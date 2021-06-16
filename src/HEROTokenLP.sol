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
  UniswapV2Factory public swapFactory;
  UniswapV2Router02 public swapRouter;
  UniswapV2Pair public swapPair;
  address public stableCoin;

  address private wrappedNative;
  bool private swapLocked;
  uint256 private pendingLPAmount;

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
  {
    uint256 totalLP = accountBalances[address(this)];

    require(
      totalLP != 0,
      "HEROTokenLP: #1"
    );

    uint256[] memory amounts;
    address[] memory path = new address[](2);

    path[0] = address(this);
    path[1] = wrappedNative;

    amounts = swapRouter.getAmountsOut(totalLP, path);

    uint256 totalValue = amounts[1];

    require(
      totalValue != 0,
      "HEROTokenLP: #2"
    );

    path[0] = wrappedNative;
    path[1] = stableCoin;

    amounts = swapRouter.getAmountsOut(totalValue, path);

    totalValue = amounts[1];

    require(
      totalValue != 0
    );
  }

  // internal functions

  function _initializeLP(
    address swapRouter_,
    address stableCoin_
  )
    internal
  {
    require(
      swapRouter_ != address(0),
      "HEROTokenLP: #3"
    );

    require(
      stableCoin_ != address(0),
      "HEROTokenLP: #4"
    );

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

    pendingLPAmount = pendingLPAmount.add(amount);

    if (!swapLocked) {
      swapLocked = true;

      uint256 half = pendingLPAmount.div(2);
      uint256 otherHalf = pendingLPAmount.sub(half);

      _swapTokensForEth(half);

      uint256 ethAmount = address(this).balance;

      _addLiquidity(
        otherHalf,
        ethAmount
      );

      pendingLPAmount = 0;
      swapLocked = false;
    }
  }

  // private functions

  function _swapTokensForEth(
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
    uint256 ethAmount
  )
    private
  {
    if (tokenAmount != 0 && ethAmount != 0) {
      _approve(
        address(this),
        address(swapRouter),
        tokenAmount
      );

      swapRouter.addLiquidityETH{value : ethAmount}(
        address(this),
        tokenAmount,
        0,
        0,
        address(this),
        block.timestamp // solhint-disable-line not-rely-on-time
      );
    }
  }
}
