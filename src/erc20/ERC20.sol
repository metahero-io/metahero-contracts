// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./ERC20Metadata.sol";
import "./ERC20Standard.sol";


abstract contract ERC20 is ERC20Metadata, ERC20Standard {
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
