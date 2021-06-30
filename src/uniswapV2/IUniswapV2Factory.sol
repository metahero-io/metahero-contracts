// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.12;

/**
 * @title Uniswap v2 factory interface
 *
 * @notice Based on https://github.com/Uniswap/uniswap-v2-core/blob/4dd59067c76dea4a0e8e4bfdda41877a6b16dedc/contracts/interfaces/IUniswapV2Factory.sol
 */
interface IUniswapV2Factory {
  // events

  event PairCreated(
    address indexed token0,
    address indexed token1,
    address pair,
    uint256
  );

  // external functions

  function createPair(
    address tokenA,
    address tokenB
  )
    external
    returns (address);

  function setFeeTo(
    address
  )
    external;

  function setFeeToSetter(
    address
  )
    external;

  // external functions (views)

  function feeTo()
    external
    view
    returns (address);

  function feeToSetter()
    external
    view
    returns (address);

  function getPair(
    address tokenA,
    address tokenB
  )
    external
    view
    returns (address);

  function allPairs(
    uint256
  )
    external
    view
    returns (address);

  function allPairsLength()
    external
    view
    returns (uint256);
}

