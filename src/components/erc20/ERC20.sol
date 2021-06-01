// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

abstract contract ERC20 {
  // events

  event Approval(
    address indexed owner,
    address indexed spender,
    uint256 value
  );

  event Transfer(
    address indexed from,
    address indexed to,
    uint256 value
  );

  // external functions

  function approve(
    address spender,
    uint256 value
  )
    external
    virtual
    returns (bool);

  function transfer(
    address to,
    uint256 value
  )
    external
    virtual
    returns (bool);

  function transferFrom(
    address from,
    address to,
    uint256 value
  )
    external
    virtual
    returns (bool);

  // external functions (views)

  function totalSupply()
    external
    view
    virtual
    returns (uint256);

  function balanceOf(
    address owner
  )
    external
    view
    virtual
    returns (uint256);

  function allowance(
    address owner,
    address spender
  )
    external
    view
    virtual
    returns (uint256);
}
