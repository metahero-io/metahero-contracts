// SPDX-License-Identifier: GPL-3.0
/* solhint-disable */
pragma solidity ^0.6.12;

import "../core/math/SafeMathLib.sol";
import "../uniswapV2/IUniswapV2Pair.sol";
import "./PancakePair.sol";


/**
 * @title Pancake library
 *
 * @notice Based on https://github.com/pancakeswap/pancake-swap-periphery/blob/d769a6d136b74fde82502ec2f9334acc1afc0732/contracts/libraries/PancakeLibrary.sol
 */
library PancakeLibrary {
  using SafeMathLib for uint;

  bytes32 private constant INIT_CODE_PAIR_HASH = keccak256(abi.encodePacked(type(PancakePair).creationCode));

  // internal functions (pure)

  function sortTokens(
    address tokenA,
    address tokenB
  )
    internal
    pure
    returns (address token0, address token1)
  {
    require(tokenA != tokenB, 'PancakeLibrary: IDENTICAL_ADDRESSES');
    (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    require(token0 != address(0), 'PancakeLibrary: ZERO_ADDRESS');
  }

  function pairFor(
    address factory,
    address tokenA,
    address tokenB
  )
    internal
    pure
    returns (address pair)
  {
    (address token0, address token1) = sortTokens(tokenA, tokenB);
    pair = address(uint(keccak256(abi.encodePacked(
        hex'ff',
        factory,
        keccak256(abi.encodePacked(token0, token1)),
        INIT_CODE_PAIR_HASH
      ))));
  }

  function quote(
    uint amountA,
    uint reserveA,
    uint reserveB
  )
    internal
    pure
    returns (uint amountB)
  {
    require(amountA > 0, 'PancakeLibrary: INSUFFICIENT_AMOUNT');
    require(reserveA > 0 && reserveB > 0, 'PancakeLibrary: INSUFFICIENT_LIQUIDITY');
    amountB = amountA.mul(reserveB) / reserveA;
  }

  function getAmountOut(
    uint amountIn,
    uint reserveIn,
    uint reserveOut
  )
    internal
    pure
    returns (uint amountOut)
  {
    require(amountIn > 0, 'PancakeLibrary: INSUFFICIENT_INPUT_AMOUNT');
    require(reserveIn > 0 && reserveOut > 0, 'PancakeLibrary: INSUFFICIENT_LIQUIDITY');
    uint amountInWithFee = amountIn.mul(998);
    uint numerator = amountInWithFee.mul(reserveOut);
    uint denominator = reserveIn.mul(1000).add(amountInWithFee);
    amountOut = numerator / denominator;
  }

  function getAmountIn(
    uint amountOut,
    uint reserveIn,
    uint reserveOut
  )
    internal
    pure
    returns (uint amountIn)
  {
    require(amountOut > 0, 'PancakeLibrary: INSUFFICIENT_OUTPUT_AMOUNT');
    require(reserveIn > 0 && reserveOut > 0, 'PancakeLibrary: INSUFFICIENT_LIQUIDITY');
    uint numerator = reserveIn.mul(amountOut).mul(1000);
    uint denominator = reserveOut.sub(amountOut).mul(998);
    amountIn = (numerator / denominator).add(1);
  }

  // internal functions (pure)

  function getReserves(
    address factory,
    address tokenA,
    address tokenB
  )
    internal
    view
    returns (uint reserveA, uint reserveB)
  {
    (address token0,) = sortTokens(tokenA, tokenB);
    pairFor(factory, tokenA, tokenB);
    (uint reserve0, uint reserve1,) = IUniswapV2Pair(pairFor(factory, tokenA, tokenB)).getReserves();
    (reserveA, reserveB) = tokenA == token0 ? (reserve0, reserve1) : (reserve1, reserve0);
  }

  function getAmountsOut(
    address factory,
    uint amountIn,
    address[] memory path
  )
    internal
    view
    returns (uint[] memory amounts)
  {
    require(path.length >= 2, 'PancakeLibrary: INVALID_PATH');
    amounts = new uint[](path.length);
    amounts[0] = amountIn;
    for (uint i; i < path.length - 1; i++) {
      (uint reserveIn, uint reserveOut) = getReserves(factory, path[i], path[i + 1]);
      amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut);
    }
  }

  function getAmountsIn(
    address factory,
    uint amountOut,
    address[] memory path
  )
    internal
    view
    returns (uint[] memory amounts)
  {
    require(path.length >= 2, 'PancakeLibrary: INVALID_PATH');
    amounts = new uint[](path.length);
    amounts[amounts.length - 1] = amountOut;
    for (uint i = path.length - 1; i > 0; i--) {
      (uint reserveIn, uint reserveOut) = getReserves(factory, path[i - 1], path[i]);
      amounts[i - 1] = getAmountIn(amounts[i], reserveIn, reserveOut);
    }
  }
}
