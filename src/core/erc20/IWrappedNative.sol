// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.12;

import "./IERC20.sol";


/**
 * @title Wrapped native (eg. WBNB, WETH) token interface
 *
 * @notice Based on https://github.com/Uniswap/uniswap-v2-periphery/blob/dda62473e2da448bc9cb8f4514dadda4aeede5f4/contracts/interfaces/IWETH.sol
 */
interface IWrappedNative is IERC20 {
  // external functions

  function deposit()
    external
    payable;

  function withdraw(
    uint256 amount
  )
    external;
}
