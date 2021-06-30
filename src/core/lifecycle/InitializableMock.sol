// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./Initializable.sol";


/**
 * @title Initializable mock
 *
 * @author Stanisław Głogowski <stan@metaMetahero.io>
 */
contract InitializableMock is Initializable {
  // events

  event Triggered();

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
    emit Triggered();
  }
}
