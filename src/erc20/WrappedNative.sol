// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./ERC20Standard.sol";


interface WrappedNative is ERC20Standard {
  // external functions

  function deposit()
    external payable;

  function withdraw(
    uint256 amount
  )
    external;
}
