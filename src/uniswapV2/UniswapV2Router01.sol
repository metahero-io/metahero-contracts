// SPDX-License-Identifier: GPL-3.0
/* solhint-disable func-name-mixedcase */
pragma solidity ^0.6.12;

/**
 * @title Uniswap V2 router01 interface
 *
 * @notice Based on https://github.com/Uniswap/uniswap-v2-periphery/blob/dda62473e2da448bc9cb8f4514dadda4aeede5f4/contracts/interfaces/IUniswapV2Router01.sol
 */
interface UniswapV2Router01 {
  // external functions

  function addLiquidityETH(
    address token,
    uint amountTokenDesired,
    uint amountTokenMin,
    uint amountETHMin,
    address to,
    uint deadline
  )
    external
    payable
    returns (uint, uint, uint);

  function swapExactETHForTokens(
    uint amountOutMin,
    address[] calldata path,
    address to,
    uint deadline
  )
    external
    payable
    returns (uint[] memory);

  function addLiquidity(
    address tokenA,
    address tokenB,
    uint amountADesired,
    uint amountBDesired,
    uint amountAMin,
    uint amountBMin,
    address to,
    uint deadline
  )
    external
    returns (uint, uint, uint);

  function removeLiquidity(
    address tokenA,
    address tokenB,
    uint liquidity,
    uint amountAMin,
    uint amountBMin,
    address to,
    uint deadline
  )
    external
    returns (uint, uint);

  function removeLiquidityETH(
    address token,
    uint liquidity,
    uint amountTokenMin,
    uint amountETHMin,
    address to,
    uint deadline
  )
    external
    returns (uint, uint);

  function removeLiquidityWithPermit(
    address tokenA,
    address tokenB,
    uint liquidity,
    uint amountAMin,
    uint amountBMin,
    address to,
    uint deadline,
    bool approveMax,
    uint8 v,
    bytes32 r,
    bytes32 s
  )
    external
    returns (uint, uint);

  function removeLiquidityETHWithPermit(
    address token,
    uint liquidity,
    uint amountTokenMin,
    uint amountETHMin,
    address to,
    uint deadline,
    bool approveMax,
    uint8 v,
    bytes32 r,
    bytes32 s
  )
    external
    returns (uint, uint);

  function swapExactTokensForTokens(
    uint amountIn,
    uint amountOutMin,
    address[] calldata path,
    address to,
    uint deadline
  )
    external
    returns (uint[] memory);

  function swapTokensForExactTokens(
    uint amountOut,
    uint amountInMax,
    address[] calldata path,
    address to,
    uint deadline
  )
    external
    returns (uint[] memory);

  function swapTokensForExactETH(
    uint amountOut,
    uint amountInMax,
    address[] calldata path,
    address to,
    uint deadline
  )
    external
    returns (uint[] memory);

  function swapExactTokensForETH(
    uint amountIn,
    uint amountOutMin,
    address[] calldata path,
    address to,
    uint deadline
  )
    external
    returns (uint[] memory);

  function swapETHForExactTokens(
    uint amountOut,
    address[] calldata path,
    address to,
    uint deadline
  )
    external
    payable
    returns (uint[] memory);

  // external functions (views)

  function getAmountsOut(
    uint amountIn,
    address[] calldata path
  )
    external
    view
    returns (uint[] memory);

  function getAmountsIn(
    uint amountOut,
    address[] calldata path
  )
    external
    view
    returns (uint[] memory);

  // external functions (pure)

  function quote(
    uint amountA,
    uint reserveA,
    uint reserveB
  )
    external
    pure
    returns (uint);

  function getAmountOut(
    uint amountIn,
    uint reserveIn,
    uint reserveOut
  )
    external
    pure
    returns (uint);

  function getAmountIn(
    uint amountOut,
    uint reserveIn,
    uint reserveOut
  )
    external
    pure
    returns (uint);

  function factory()
    external
    pure
    returns (address);

  function WETH()
    external
    pure
    returns (address);
}
