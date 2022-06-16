// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

abstract contract Initializable {
  address private _deployer;

  // errors

  error AlreadyInitialized();
  error MsgSenderIsNotTheDeployer();

  // modifiers

  modifier initializer() {
    if (_deployer == address(0)) {
      revert AlreadyInitialized();
    }

    if (msg.sender != _deployer) {
      revert MsgSenderIsNotTheDeployer();
    }

    _deployer = address(0);

    _;
  }

  // constructor

  constructor() {
    _deployer = msg.sender;
  }

  // external functions (views)

  function initialized() external view returns (bool) {
    return _deployer == address(0);
  }
}
