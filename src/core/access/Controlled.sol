// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

/**
 * @title Controlled
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
contract Controlled {
  /**
   * @return controller address
   */
  address public controller;

  // modifiers

  /**
   * @dev Throws if msg.sender is not the controller
   */
  modifier onlyController() {
    require(
      msg.sender == controller,
      "Controlled#1" // msg.sender is not the controller
    );

    _;
  }

  // events

  /**
   * @dev Emitted when the controller is updated
   * @param controller new controller address
   */
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
      "Controlled#2" // controller is the zero address
    );

    require(
      controller_ != controller,
      "Controlled#3" // does not update the controller
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
      "Controlled#4" // controller is the zero address
    );

    controller = address(0);

    emit ControllerUpdated(
      address(0)
    );
  }
}
