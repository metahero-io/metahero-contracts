// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

/**
 * @title Initializable
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
contract Initializable {
  address private initializer;

  // events

  event Initialized();

  // modifiers

  modifier onlyInitializer() {
    require(
      initializer != address(0),
      "Initializable#1"
    );

    require(
      msg.sender == initializer,
      "Initializable#2"
    );

    initializer = address(0);

    _;

    emit Initialized();
  }

  /**
   * @dev Internal constructor
   */
  constructor()
    internal
  {
    initializer = msg.sender;
  }

  // external functions (views)

  function initialized()
    external
    view
    returns (bool)
  {
    return initializer == address(0);
  }
}
