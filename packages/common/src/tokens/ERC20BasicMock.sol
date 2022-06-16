// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC20Basic.sol";

contract ERC20BasicMock is ERC20Basic {
  // constructor

  constructor(uint256 totalSupply_) ERC20Basic("", "") {
    _mint(msg.sender, totalSupply_);
  }

  // external functions

  function mint(address to, uint256 amount) external {
    _mint(to, amount);
  }

  function burn(address from, uint256 amount) external {
    _burn(from, amount);
  }
}
