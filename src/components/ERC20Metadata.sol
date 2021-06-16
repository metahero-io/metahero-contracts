// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

contract ERC20Metadata {
  struct Metadata {
    string name;
    string symbol;
    uint8 decimals;
  }

  Metadata private metadata;

  /**
   * @dev Internal constructor
   */
  constructor (
    Metadata memory metadata_
  )
    internal
  {
    metadata = metadata_;
  }

  // external functions (views)

  function name()
    external
    view
    virtual
    returns (string memory)
  {
    return metadata.name;
  }

  function symbol()
    external
    view
    virtual
    returns (string memory)
  {
    return metadata.symbol;
  }

  function decimals()
    external
    view
    virtual
    returns (uint8)
  {
    return metadata.decimals;
  }
}
