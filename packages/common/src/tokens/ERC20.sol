// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Context.sol";
import "./IERC20.sol";
import "./IERC20Metadata.sol";

abstract contract ERC20 is IERC20, IERC20Metadata, Context {
  string private _name;

  string private _symbol;

  uint256 private _totalSupply;

  mapping(address => bool) private _operators;

  mapping(address => mapping(address => uint256)) private _allowances;

  // errors

  error AmountExceedsBalance();
  error InsufficientAllowance();
  error MintToTheZeroAddress();
  error SpenderIsTheZeroAddress();
  error TransferToTheZeroAddress();
  error AmountIsZero();

  // constructor

  constructor(string memory name_, string memory symbol_) {
    _name = name_;
    _symbol = symbol_;
  }

  // external functions (pure)

  function decimals() external pure returns (uint8) {
    return 18;
  }

  // external functions (views)

  function name() external view returns (string memory) {
    return _name;
  }

  function symbol() external view returns (string memory) {
    return _symbol;
  }

  function totalSupply() external view returns (uint256) {
    return _totalSupply;
  }

  function allowance(address owner, address spender)
    external
    view
    returns (uint256)
  {
    return _allowances[owner][spender];
  }

  function balanceOf(address account) external view returns (uint256) {
    return _balanceOf(account);
  }

  // external functions

  function approve(address spender, uint256 amount) external returns (bool) {
    if (spender == address(0)) {
      revert SpenderIsTheZeroAddress();
    }

    _approve(_msgSender(), spender, amount);

    return true;
  }

  function transfer(address to, uint256 amount) external returns (bool) {
    _transfer(_msgSender(), to, amount);

    return true;
  }

  function transferFrom(
    address from,
    address to,
    uint256 amount
  ) external returns (bool) {
    _spendAllowance(from, _msgSender(), amount);

    _transfer(from, to, amount);

    return true;
  }

  // internal functions (views)

  function _balanceOf(address account) internal view virtual returns (uint256);

  // internal functions

  function _setOperators(address[] memory operators) internal {
    uint256 len = operators.length;

    for (uint256 i; i < len; ) {
      address operator = operators[i];

      if (operator != address(0)) {
        _operators[operator] = true;
      }

      unchecked {
        ++i;
      }
    }
  }

  function _approve(
    address owner,
    address spender,
    uint256 amount
  ) internal {
    _allowances[owner][spender] = amount;

    emit Approval(owner, spender, amount);
  }

  function _spendAllowance(
    address owner,
    address spender,
    uint256 amount
  ) internal {
    uint256 currentAllowance = _allowances[owner][spender];

    if (currentAllowance != type(uint256).max && !_operators[spender]) {
      if (currentAllowance < amount) {
        revert InsufficientAllowance();
      }

      unchecked {
        _approve(owner, spender, currentAllowance - amount);
      }
    }
  }

  function _mint(address to, uint256 amount) internal {
    if (to == address(0)) {
      revert MintToTheZeroAddress();
    }

    if (amount == 0) {
      revert AmountIsZero();
    }

    _mintHandler(to, amount);

    _totalSupply += amount;

    emit Transfer(address(0), to, amount);
  }

  function _burn(address from, uint256 amount) internal {
    if (amount == 0) {
      revert AmountIsZero();
    }

    if (_balanceOf(from) < amount) {
      revert AmountExceedsBalance();
    }

    _burnHandler(from, amount);

    unchecked {
      _totalSupply -= amount;
    }

    emit Transfer(from, address(0), amount);
  }

  function _transfer(
    address from,
    address to,
    uint256 amount
  ) internal {
    if (to == address(0)) {
      revert TransferToTheZeroAddress();
    }

    if (amount == 0) {
      revert AmountIsZero();
    }

    if (_balanceOf(from) < amount) {
      revert AmountExceedsBalance();
    }

    _transferHandler(from, to, amount);

    emit Transfer(from, to, amount);
  }

  function _mintHandler(address to, uint256 amount) internal virtual;

  function _burnHandler(address from, uint256 amount) internal virtual;

  function _transferHandler(
    address from,
    address to,
    uint256 amount
  ) internal virtual;
}
