// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

/**
 * @title Owned
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
contract Owned {
  /**
   * @return owner address
   */
  address public owner;

  // modifiers

  /**
   * @dev Throws if msg.sender is not the owner
   */
  modifier onlyOwner() {
    require(
      msg.sender == owner,
      "Owned#1" // msg.sender is not the owner
    );

    _;
  }

  // events

  /**
   * @dev Emitted when the owner is updated
   * @param owner new owner address
   */
  event OwnerUpdated(address owner);

  /**
   * @dev Internal constructor
   */
  constructor() internal {
    owner = msg.sender;
  }

  // external functions

  /**
   * @notice Sets a new owner
   * @param owner_ owner address
   */
  function setOwner(address owner_) external onlyOwner {
    _setOwner(owner_);
  }

  // internal functions

  function _setOwner(address owner_) internal {
    require(
      owner_ != address(0),
      "Owned#2" // owner is the zero address
    );

    require(
      owner_ != owner,
      "Owned#3" // does not update the owner
    );

    owner = owner_;

    emit OwnerUpdated(owner_);
  }
}
