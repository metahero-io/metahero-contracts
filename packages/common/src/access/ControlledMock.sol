// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./Controlled.sol";

contract ControlledMock is Controlled {
  // events

  event Tested();

  // constructor

  constructor() Controlled() {
    //
  }

  // external functions (views)

  function hasController(address controller) external view returns (bool) {
    return _hasController(controller);
  }

  // external functions

  function setControllers(address[] calldata controllers) external {
    _setControllers(controllers);
  }

  function testOnlyController() external onlyController {
    emit Tested();
  }
}
