// SPDX-License-Identifier: MIT
/* solhint-disable func-name-mixedcase */
pragma solidity ^0.6.12;

import "../erc20/ERC20Standard.sol";


interface UniswapV2Pair is ERC20Standard {
  // events

  event Mint(
    address indexed sender,
    uint amount0,
    uint amount1
  );

  event Burn(
    address indexed sender,
    uint amount0,
    uint amount1,
    address indexed to
  );

  event Swap(
    address indexed sender,
    uint amount0In,
    uint amount1In,
    uint amount0Out,
    uint amount1Out,
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
    returns (uint);

  function burn(
    address to
  )
    external
    returns (uint, uint);

  function swap(
    uint amount0Out,
    uint amount1Out,
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
    uint value,
    uint deadline,
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
    returns (uint);

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
    returns (uint);

  function price1CumulativeLast()
    external
    view
    returns (uint);

  function kLast()
    external
    view
    returns (uint);

  // external functions (pure)

  function PERMIT_TYPEHASH()
    external
    pure
    returns (bytes32);

  function MINIMUM_LIQUIDITY()
    external
    pure
    returns (uint);
}
