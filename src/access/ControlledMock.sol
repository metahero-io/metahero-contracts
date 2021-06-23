// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./Controlled.sol";


/**
 * @title Controlled mock
 */
contract ControlledMock is Controlled {
  // events

  event Triggered();

  /**
   * @dev Public constructor
   */
  constructor()
    public
    Controlled()
  {
    //
  }

  // external functions

  function triggerOnlyController()
    external
    onlyController
  {
    emit Triggered();
  }

  function initializeController(
    address controller_
  )
    external
  {
    _initializeController(controller_);
  }

  function setController(
    address controller_
  )
    external
  {
    _setController(controller_);
  }

  function removeController()
    external
  {
    _removeController();
  }
}
