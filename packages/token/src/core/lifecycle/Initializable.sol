// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

/**
 * @title Initializable
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
contract Initializable {
  address private initializer;

  // modifiers

  /**
   * @dev Throws if msg.sender is not the initializer
   */
  modifier onlyInitializer() {
    require(
      initializer != address(0),
      "Initializable#1" // already initialized
    );

    require(
      msg.sender == initializer,
      "Initializable#2" // msg.sender is not the initializer
    );

    /// @dev removes initializer
    initializer = address(0);

    _;
  }

  /**
   * @dev Internal constructor
   */
  constructor() internal {
    initializer = msg.sender;
  }

  // external functions (views)

  /**
   * @notice Checks if contract is initialized
   * @return true when contract is initialized
   */
  function initialized() external view returns (bool) {
    return initializer == address(0);
  }
}
