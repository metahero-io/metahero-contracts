// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./Ownable.sol";

contract OwnableMock is Ownable {
  // events

  event Tested();

  // constructor

  constructor() Ownable() {
    //
  }

  // external functions

  function testOnlyOwner() external onlyOwner {
    emit Tested();
  }
}
