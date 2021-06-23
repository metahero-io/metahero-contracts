// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./Owned.sol";


/**
 * @title Owned mock
 */
contract OwnedMock is Owned {
  // events

  event Triggered();

  /**
   * @dev Public constructor
   */
  constructor()
    public
    Owned()
  {
    //
  }

  // external functions

  function triggerOnlyOwner()
    external
    onlyOwner
  {
    emit Triggered();
  }
}
