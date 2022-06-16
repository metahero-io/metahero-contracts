// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IERC20 {
  // events

  event Approval(address indexed owner, address indexed spender, uint256 value);

  event Transfer(address indexed from, address indexed to, uint256 value);

  // external functions (views)

  function totalSupply() external view returns (uint256);

  function allowance(address owner, address spender)
    external
    view
    returns (uint256);

  function balanceOf(address account) external view returns (uint256);

  // external functions

  function approve(address spender, uint256 amount) external returns (bool);

  function transfer(address to, uint256 amount) external returns (bool);

  function transferFrom(
    address from,
    address to,
    uint256 amount
  ) external returns (bool);
}
