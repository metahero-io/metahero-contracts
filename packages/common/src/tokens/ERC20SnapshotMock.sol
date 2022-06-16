// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC20Snapshot.sol";

contract ERC20SnapshotMock is ERC20Snapshot {
  // constructor

  constructor(uint256 totalSupply_) ERC20Snapshot("", "") {
    _mint(msg.sender, totalSupply_);
  }

  // external functions

  function setSnapshotWindowLength(uint256 snapshotWindowLength) external {
    _setSnapshotWindowLength(snapshotWindowLength);
  }

  function mint(address to, uint256 amount) external {
    _mint(to, amount);
  }

  function burn(address from, uint256 amount) external {
    _burn(from, amount);
  }
}
