// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.12;

/**
 * @title Pancake callee interfaces
 *
 * @notice Based on https://github.com/pancakeswap/pancake-swap-core/blob/3b214306770e86bc3a64e67c2b5bdb566b4e94a7/contracts/interfaces/IPancakeCallee.sol
 */
interface IPancakeCallee {
  // external functions

  function pancakeCall(
    address sender,
    uint amount0,
    uint amount1,
    bytes calldata data
  )
    external;
}
