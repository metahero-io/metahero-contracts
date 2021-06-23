// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.12;

import "./ERC20Standard.sol";


/**
 * @title Wrapped native token interface
 *
 * @notice Based on https://github.com/Uniswap/uniswap-v2-periphery/blob/dda62473e2da448bc9cb8f4514dadda4aeede5f4/contracts/interfaces/IWETH.sol
 */
interface WrappedNative is ERC20Standard {
  // external functions

  function deposit()
    external payable;

  function withdraw(
    uint256 amount
  )
    external;
}
