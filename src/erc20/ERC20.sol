// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./ERC20WithMetadata.sol";


abstract contract ERC20 is ERC20WithMetadata {
  string public override name;
  string public override symbol;
  uint8 public override decimals;

  /**
   * @dev Internal constructor
   */
  constructor (
    string memory name_,
    string memory symbol_,
    uint8 decimals_
  )
    internal
  {
    name = name_;
    symbol = symbol_;
    decimals = decimals_;
  }
}
