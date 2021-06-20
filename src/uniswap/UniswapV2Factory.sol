// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

interface UniswapV2Factory {
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

