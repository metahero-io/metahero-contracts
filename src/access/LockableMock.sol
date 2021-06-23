// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./Lockable.sol";


/**
 * @title Lockable mock
 */
contract LockableMock is Lockable {
  // events

  event Triggered();

  /**
   * @dev Public constructor
   */
  constructor()
    public
  {
    //
  }

  // external functions

  function setLocked(
    bool locked_
  )
    external
  {
    locked = locked_;
  }

  // external functions

  function triggerLock()
    external
    lock
  {
    emit Triggered();
  }

  function triggerLockOrThrowError()
    external
    lockOrThrowError
  {
    emit Triggered();
  }
}
