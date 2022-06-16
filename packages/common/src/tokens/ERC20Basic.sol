// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC20.sol";

abstract contract ERC20Basic is ERC20 {
  mapping(address => uint256) private _balances;

  // constructor

  constructor(string memory name_, string memory symbol_)
    ERC20(name_, symbol_)
  {
    //
  }

  // internal functions (views)

  function _balanceOf(address account)
    internal
    view
    virtual
    override
    returns (uint256)
  {
    return _balances[account];
  }

  // internal functions

  function _mintHandler(address to, uint256 amount) internal virtual override {
    _balances[to] += amount;
  }

  function _burnHandler(address from, uint256 amount)
    internal
    virtual
    override
  {
    unchecked {
      _balances[from] -= amount;
    }
  }

  function _transferHandler(
    address from,
    address to,
    uint256 amount
  ) internal virtual override {
    unchecked {
      _balances[from] -= amount;
    }

    _balances[to] += amount;
  }
}
