// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

/**
 * @title Controlled
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
contract Controlled {
  address public controller;

  // modifiers

  modifier onlyController() {
    require(
      msg.sender == controller,
      "Controlled#1"
    );

    _;
  }

  // events

  event ControllerUpdated(
    address controller
  );

  /**
   * @dev Internal constructor
   */
  constructor()
    internal
  {
    //
  }

  // internal functions

  function _initializeController(
    address controller_
  )
    internal
  {
    controller = controller_;
  }

  function _setController(
    address controller_
  )
    internal
  {
    require(
      controller_ != address(0),
      "Controlled#2"
    );

    require(
      controller_ != controller,
      "Controlled#3"
    );

    controller = controller_;

    emit ControllerUpdated(
      controller_
    );
  }

  function _removeController()
    internal
  {
    require(
      controller != address(0),
      "Controlled#4"
    );

    controller = address(0);

    emit ControllerUpdated(
      address(0)
    );
  }
}
