// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

/**
 * @title Lockable
 */
contract Lockable {
  bool private locked;

  // modifiers

  modifier lock() {
    require(
      !locked,
      "Lockable: locked"
    );

    locked = true;

    _;

    locked = false;
  }
}
