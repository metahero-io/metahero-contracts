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

    swapPair = UniswapV2Factory(swapRouter.factory())
    .createPair(
      address(this),
        swapRouter.WETH()
    );

    _exclude(address(this));
    _exclude(address(swapRouter));
    _exclude(swapPair);
  }

  function _increaseTotalLP(
    uint256 amount
  )
    internal
    override
  {
    if (amount != 0) {
      balances[address(this)] = balances[address(this)].add(amount);
      summary.totalLP = summary.totalLP.add(amount);

      swapAndLiquify(amount);
    }
  }

  // private functions

  function swapAndLiquify(
    uint256 amount
  )
    private
  {
    uint256 half = amount.div(2);
    uint256 otherHalf = amount.sub(half);

    uint256 initialBalance = address(this).balance;

    swapTokensForEth(half);

    uint256 newBalance = address(this).balance.sub(initialBalance);

    addLiquidity(otherHalf, newBalance);
  }

  function swapTokensForEth(
    uint256 tokenAmount
  )
    private
  {
    address[] memory path = new address[](2);

    path[0] = address(this);
    path[1] = swapRouter.WETH();

    _approve(
      address(this),
      address(swapRouter),
      tokenAmount
    );

    swapRouter.swapExactTokensForETHSupportingFeeOnTransferTokens(
      tokenAmount,
      0,
      path,
      address(this),
      block.timestamp // solhint-disable-line not-rely-on-time
    );
  }

  function addLiquidity(
    uint256 tokenAmount,
    uint256 ethAmount
  )
    private
  {
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
