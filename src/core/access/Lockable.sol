// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

/**
 * @title Lockable
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
contract Lockable {
  /**
   * @return true when contract is locked
   */
  bool public locked;

  // modifiers


  /**
   * @dev Calls only when contract is unlocked
   */
  modifier lock() {
    if (!locked) {
      locked = true;

      _;

      locked = false;
    }
  }

  /**
   * @dev Throws if contract is locked
   */
  modifier lockOrThrowError() {
    require(
      !locked,
      "Lockable#1" // contract is locked
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
