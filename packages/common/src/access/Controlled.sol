// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./Ownable.sol";

abstract contract Controlled is Ownable {
  mapping(address => bool) private _controllers;

  // events

  event ControllerAdded(address controller);

  event ControllerRemoved(address controller);

  // errors

  error ControllerAlreadyExists();
  error ControllerDoesntExist();
  error ControllerIsTheZeroAddress();
  error MsgSenderIsNotTheController();

  // modifiers

  modifier onlyController() {
    if (!_controllers[msg.sender]) {
      revert MsgSenderIsNotTheController();
    }

    _;
  }

  // constructor

  constructor() Ownable() {
    //
  }

  // external functions

  function addController(address controller) external onlyOwner {
    if (controller == address(0)) {
      revert ControllerIsTheZeroAddress();
    }

    if (_controllers[controller]) {
      revert ControllerAlreadyExists();
    }

    _controllers[controller] = true;

    emit ControllerAdded(controller);
  }

  function removeController(address controller) external onlyOwner {
    if (!_controllers[controller]) {
      revert ControllerDoesntExist();
    }

    _controllers[controller] = false;

    emit ControllerRemoved(controller);
  }

  // internal functions (views)

  function _hasController(address controller) internal view returns (bool) {
    return _controllers[controller];
  }

  // internal functions

  function _setControllers(address[] memory controllers) internal {
    uint256 len = controllers.length;

    for (uint256 i; i < len; ) {
      address controller = controllers[i];

      if (controller != address(0)) {
        _controllers[controller] = true;
      }

      unchecked {
        ++i;
      }
    }
  }
}
