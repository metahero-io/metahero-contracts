// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

/**
 * @title Owned
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
contract Owned {
  address public owner;

  // modifiers

  modifier onlyOwner() {
    require(
      msg.sender == owner,
      "Owned#1"
    );

    _;
  }

  // events

  event OwnerUpdated(
    address owner
  );

  /**
   * @dev Internal constructor
   */
  constructor()
    internal
  {
    owner = msg.sender;
  }

  // external functions

  function setOwner(
    address owner_
  )
    external
    onlyOwner
  {
    require(
      owner_ != address(0),
      "Owned#2"
    );

    require(
      owner_ != owner,
      "Owned#3"
    );

    owner = owner_;

    emit OwnerUpdated(
      owner_
    );
  }
}
