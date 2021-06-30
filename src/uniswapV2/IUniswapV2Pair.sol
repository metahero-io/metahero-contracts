// SPDX-License-Identifier: GPL-3.0
/* solhint-disable func-name-mixedcase */
pragma solidity ^0.6.12;

import "../core/erc20/IERC20.sol";


/**
 * @title Uniswap V2 pair interface
 *
 * @notice Based on https://github.com/Uniswap/uniswap-v2-core/blob/4dd59067c76dea4a0e8e4bfdda41877a6b16dedc/contracts/interfaces/IUniswapV2Pair.sol
 */
interface IUniswapV2Pair is IERC20 {
  // events

  event Mint(
    address indexed sender,
    uint256 amount0,
    uint256 amount1
  );

  event Burn(
    address indexed sender,
    uint256 amount0,
    uint256 amount1,
    address indexed to
  );

  event Swap(
    address indexed sender,
    uint256 amount0In,
    uint256 amount1In,
    uint256 amount0Out,
    uint256 amount1Out,
    address indexed to
  );

  event Sync(
    uint112 reserve0,
    uint112 reserve1
  );

  // external functions

  function initialize(
    address,
    address
  )
    external;

  function mint(
    address to
  )
    external
    returns (uint256);

  function burn(
    address to
  )
    external
    returns (uint256, uint256);

  function swap(
    uint256 amount0Out,
    uint256 amount1Out,
    address to,
    bytes calldata data
  )
    external;

  function skim(
    address to
  )
    external;

  function sync()
    external;

  function permit(
    address owner,
    address spender,
    uint256 value,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  )
    external;

  // external functions (views)

  function DOMAIN_SEPARATOR()
    external
    view
    returns (bytes32);

  function nonces(
    address owner
  )
    external
    view
    returns (uint256);

  function factory()
    external
    view
    returns (address);

  function token0()
    external
    view
    returns (address);

  function token1()
    external
    view
    returns (address);

  function getReserves()
    external
    view
    returns (uint112, uint112, uint32);

  function price0CumulativeLast()
    external
    view
    returns (uint256);

  function price1CumulativeLast()
    external
    view
    returns (uint256);

  function kLast()
    external
    view
    returns (uint256);

  // external functions (pure)

  function PERMIT_TYPEHASH()
    external
    pure
    returns (bytes32);

  function MINIMUM_LIQUIDITY()
    external
    pure
    returns (uint256);
}
