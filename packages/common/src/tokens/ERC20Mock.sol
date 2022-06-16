// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC20.sol";

contract ERC20Mock is ERC20 {
  mapping(address => uint256) private _balances;

  // constructor

  constructor(uint256 totalSupply_) ERC20("ERC20 Mock", "ERC20-MOCK") {
    _mint(msg.sender, totalSupply_);
  }

  // external functions

  function mint(address to, uint256 amount) external {
    _mint(to, amount);
  }

  function burn(address from, uint256 amount) external {
    _burn(from, amount);
  }

  function setOperators(address[] calldata operators) external {
    _setOperators(operators);
  }

  // internal functions (views)

  function _balanceOf(address account)
    internal
    view
    override
    returns (uint256)
  {
    return _balances[account];
  }

  // internal functions

  function _mintHandler(address to, uint256 amount) internal override {
    _balances[to] += amount;
  }

  function _burnHandler(address from, uint256 amount) internal override {
    _balances[from] -= amount;
  }

  function _transferHandler(
    address from,
    address to,
    uint256 amount
  ) internal override {
    _balances[from] -= amount;
    _balances[to] += amount;
  }
}
