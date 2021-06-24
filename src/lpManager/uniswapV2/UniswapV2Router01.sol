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
    uint256 amountTokenDesired,
    uint256 amountTokenMin,
    uint256 amountETHMin,
    address to,
    uint256 deadline
  )
    external
    payable
    returns (uint256, uint256, uint256);

  function swapExactETHForTokens(
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
  )
    external
    payable
    returns (uint256[] memory);

  function addLiquidity(
    address tokenA,
    address tokenB,
    uint256 amountADesired,
    uint256 amountBDesired,
    uint256 amountAMin,
    uint256 amountBMin,
    address to,
    uint256 deadline
  )
    external
    returns (uint256, uint256, uint256);

  function removeLiquidity(
    address tokenA,
    address tokenB,
    uint256 liquidity,
    uint256 amountAMin,
    uint256 amountBMin,
    address to,
    uint256 deadline
  )
    external
    returns (uint256, uint256);

  function removeLiquidityETH(
    address token,
    uint256 liquidity,
    uint256 amountTokenMin,
    uint256 amountETHMin,
    address to,
    uint256 deadline
  )
    external
    returns (uint256, uint256);

  function removeLiquidityWithPermit(
    address tokenA,
    address tokenB,
    uint256 liquidity,
    uint256 amountAMin,
    uint256 amountBMin,
    address to,
    uint256 deadline,
    bool approveMax,
    uint8 v,
    bytes32 r,
    bytes32 s
  )
    external
    returns (uint256, uint256);

  function removeLiquidityETHWithPermit(
    address token,
    uint256 liquidity,
    uint256 amountTokenMin,
    uint256 amountETHMin,
    address to,
    uint256 deadline,
    bool approveMax,
    uint8 v,
    bytes32 r,
    bytes32 s
  )
    external
    returns (uint256, uint256);

  function swapExactTokensForTokens(
    uint256 amountIn,
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
  )
    external
    returns (uint256[] memory);

  function swapTokensForExactTokens(
    uint256 amountOut,
    uint256 amountInMax,
    address[] calldata path,
    address to,
    uint256 deadline
  )
    external
    returns (uint256[] memory);

  function swapTokensForExactETH(
    uint256 amountOut,
    uint256 amountInMax,
    address[] calldata path,
    address to,
    uint256 deadline
  )
    external
    returns (uint256[] memory);

  function swapExactTokensForETH(
    uint256 amountIn,
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
  )
    external
    returns (uint256[] memory);

  function swapETHForExactTokens(
    uint256 amountOut,
    address[] calldata path,
    address to,
    uint256 deadline
  )
    external
    payable
    returns (uint256[] memory);

  // external functions (views)

  function getAmountsOut(
    uint256 amountIn,
    address[] calldata path
  )
    external
    view
    returns (uint256[] memory);

  function getAmountsIn(
    uint256 amountOut,
    address[] calldata path
  )
    external
    view
    returns (uint256[] memory);

  // external functions (pure)

  function quote(
    uint256 amountA,
    uint256 reserveA,
    uint256 reserveB
  )
    external
    pure
    returns (uint256);

  function getAmountOut(
    uint256 amountIn,
    uint256 reserveIn,
    uint256 reserveOut
  )
    external
    pure
    returns (uint256);

  function getAmountIn(
    uint256 amountOut,
    uint256 reserveIn,
    uint256 reserveOut
  )
    external
    pure
    returns (uint256);

  function factory()
    external
    pure
    returns (address);

  function WETH()
    external
    pure
    returns (address);
}
