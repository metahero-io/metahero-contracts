// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

/**
 * @title Lockable
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
contract Lockable {
  bool public locked;

  // modifiers

  modifier lock() {
    if (!locked) {
      locked = true;

      _;

      locked = false;
    }
  }

  modifier lockOrThrowError() {
    require(
      !locked,
      "Lockable#1"
    );

    locked = true;

    _;

    locked = false;
  }

  /**
   * @dev Internal constructor
   */
  constructor()
    internal
  {
    //
  }
}
