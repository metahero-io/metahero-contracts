// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

/**
 * @title Initializable
 */
contract Initializable {
  address private initializer;

  // events

  event Initialized();

  // modifiers

  modifier onlyInitializer() {
    require(
      msg.sender != address(0),
      "Initializable: already initialized"
    );

    require(
      msg.sender == initializer,
      "Initializable: msg.sender is not the initializer"
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
