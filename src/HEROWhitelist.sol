// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./components/Controlled.sol";
import "./components/Initializable.sol";


/**
 * @title HERO whitelist
 */
contract HEROWhitelist is Controlled, Initializable {
  /**
   * @dev Public constructor
   */
  constructor ()
    public
    Controlled()
    Initializable()
  {
    //
  }

  // external functions

  function initialize()
    external
    onlyInitializer
  {
    // TODO
  }
}
