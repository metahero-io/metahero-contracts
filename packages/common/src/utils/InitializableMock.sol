// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./Initializable.sol";

contract InitializableMock is Initializable {
  // events

  event Initialized();

  // constructor

  constructor() Initializable() {
    //
  }

  // external functions

  function initialize() external initializer {
    emit Initialized();
  }
}
