// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./Initializable.sol";


/**
 * @title Initializable mock
 */
contract InitializableMock is Initializable {
  uint256 private counter;

  /**
   * @dev Public constructor
   */
  constructor()
    public
    Initializable()
  {
    //
  }

  // external functions

  function triggerOnlyInitializer()
    external
    onlyInitializer
  {
    counter++;
  }
}
