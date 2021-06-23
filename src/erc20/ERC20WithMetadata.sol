// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./ERC20Standard.sol";


interface ERC20WithMetadata is ERC20Standard {
  // external functions (pure)

  function name()
    external
    pure
    returns (string memory);

  function symbol()
    external
    pure
    returns (string memory);

  function decimals()
    external
    pure
    returns (uint8);
}
