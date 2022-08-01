// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

abstract contract Ownable {
  address internal _owner;

  // events

  event OwnerUpdated(address owner);

  // errors

  error MsgSenderIsNotTheOwner();
  error OwnerIsTheZeroAddress();

  // modifiers

  modifier onlyOwner() {
    if (msg.sender != _owner) {
      revert MsgSenderIsNotTheOwner();
    }

    _;
  }

  // constructor

  constructor() {
    _owner = msg.sender;
  }

  // external functions (views)

  function getOwner() external view returns (address) {
    return _owner;
  }

  // external functions

  function setOwner(address owner) external onlyOwner {
    if (owner == address(0)) {
      revert OwnerIsTheZeroAddress();
    }

    _owner = owner;

    emit OwnerUpdated(owner);
  }
}
