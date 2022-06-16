// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

abstract contract Context {
  // internal functions (views)

  function _msgSender() internal view virtual returns (address) {
    return msg.sender;
  }
}
