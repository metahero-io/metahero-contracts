// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

/**
 * @title Controlled
 */
contract Controlled {
  address public controller;

  // modifiers

  modifier onlyController() {
    require(
      msg.sender == controller,
      "Controlled: msg.sender is not the controller"
    );

    _;
  }

  /**
   * @dev Internal constructor
   */
  constructor()
    internal
  {
    controller = msg.sender;
  }

  // external functions

  function setController(
    address controller_
  )
    external
    onlyController
  {
    require(
      controller_ != address(0) &&
      controller_ != controller,
      "Controlled: invalid controller"
    );

    controller = controller_;
  }
}
