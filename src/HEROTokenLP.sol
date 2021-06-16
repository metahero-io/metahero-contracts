// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./external/UniswapV2Factory.sol";
import "./external/UniswapV2Router02.sol";
import "./HEROTokenEconomy.sol";


/**
 * @title HERO token liquidity pool module
 */
contract HEROTokenLP is HEROTokenEconomy {
  UniswapV2Router02 public swapRouter;
  address public swapPair;

  address private wETH;
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

  // internal functions

  function _initializeLP(
    address swapRouter_
  )
    internal
  {
    swapRouter = UniswapV2Router02(swapRouter_);

    wETH = swapRouter.WETH();

    swapPair = UniswapV2Factory(swapRouter.factory())
    .createPair(
      address(this),
      wETH
    );

    _excludeAccount(swapRouter_, true);
    _excludeAccount(swapPair, true);
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

      address[] memory swapPath = new address[](2);

      swapPath[0] = address(this);
      swapPath[1] = wETH;

      swapRouter.swapExactTokensForETHSupportingFeeOnTransferTokens(
        tokenAmount,
        0,
        swapPath,
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
