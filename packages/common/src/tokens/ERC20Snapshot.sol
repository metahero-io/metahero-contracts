// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC20.sol";

abstract contract ERC20Snapshot is ERC20 {
  struct BalanceSnapshot {
    uint256 snapshotId;
    uint256 balance;
  }

  uint256 private _snapshotWindowLength;
  uint256 private _snapshotBaseTimestamp;

  mapping(address => BalanceSnapshot[]) private _balanceSnapshots;

  // errors

  error InvalidSnapshotWindowLength();

  // constructor

  constructor(string memory name_, string memory symbol_)
    ERC20(name_, symbol_)
  {
    _snapshotBaseTimestamp = block.timestamp; // solhint-disable-line not-rely-on-time
  }

  // external functions (views)

  function computeSnapshotId(uint256 timestamp)
    external
    view
    returns (uint256)
  {
    return _computeSnapshotId(timestamp);
  }

  function balanceOfAt(address account, uint256 snapshotId)
    external
    view
    returns (uint256)
  {
    return _balanceOfAt(account, snapshotId);
  }

  // internal functions (views)

  function _computeSnapshotId(uint256 timestamp)
    internal
    view
    returns (uint256 result)
  {
    if (_snapshotWindowLength != 0 && _snapshotBaseTimestamp <= timestamp) {
      unchecked {
        result =
          ((timestamp - _snapshotBaseTimestamp) / _snapshotWindowLength) +
          1;
      }
    }

    return result;
  }

  function _balanceOf(address account)
    internal
    view
    virtual
    override
    returns (uint256)
  {
    uint256 now_ = block.timestamp; // solhint-disable-line not-rely-on-time
    uint256 snapshotId = _computeSnapshotId(now_);

    return _balanceOfAt(account, snapshotId);
  }

  function _balanceOfAt(address account, uint256 snapshotId)
    internal
    view
    returns (uint256 result)
  {
    uint256 len = _balanceSnapshots[account].length;

    if (len != 0) {
      for (uint256 pos = 1; pos <= len; ) {
        BalanceSnapshot memory balanceSnapshot;

        unchecked {
          balanceSnapshot = _balanceSnapshots[account][len - pos];
        }

        if (balanceSnapshot.snapshotId <= snapshotId) {
          result = balanceSnapshot.balance;
          break;
        }

        unchecked {
          ++pos;
        }
      }
    }

    return result;
  }

  // internal functions

  function _setSnapshotWindowLength(uint256 snapshotWindowLength) internal {
    if (snapshotWindowLength == 0) {
      revert InvalidSnapshotWindowLength();
    }

    _snapshotWindowLength = snapshotWindowLength;
  }

  function _mintHandler(address to, uint256 amount) internal virtual override {
    uint256 snapshotId = _computeSnapshotId(block.timestamp); // solhint-disable-line not-rely-on-time
    uint256 toBalance = _balanceOfAt(to, snapshotId);

    toBalance += amount;

    _setBalanceAt(to, toBalance, snapshotId);
  }

  function _burnHandler(address from, uint256 amount)
    internal
    virtual
    override
  {
    uint256 snapshotId = _computeSnapshotId(block.timestamp); // solhint-disable-line not-rely-on-time
    uint256 fromBalance = _balanceOfAt(from, snapshotId);

    unchecked {
      fromBalance -= amount;
    }

    _setBalanceAt(from, fromBalance, snapshotId);
  }

  function _transferHandler(
    address from,
    address to,
    uint256 amount
  ) internal virtual override {
    uint256 snapshotId = _computeSnapshotId(block.timestamp); // solhint-disable-line not-rely-on-time
    uint256 fromBalance = _balanceOfAt(from, snapshotId);
    uint256 toBalance = _balanceOfAt(to, snapshotId);

    unchecked {
      fromBalance -= amount;
    }

    toBalance += amount;

    _setBalanceAt(from, fromBalance, snapshotId);
    _setBalanceAt(to, toBalance, snapshotId);
  }

  // private functions

  function _setBalanceAt(
    address account,
    uint256 balance_,
    uint256 snapshotId
  ) private {
    uint256 len = _balanceSnapshots[account].length;

    if (len != 0) {
      uint256 lastIndex;

      unchecked {
        lastIndex = len - 1;
      }

      if (_balanceSnapshots[account][lastIndex].snapshotId == snapshotId) {
        _balanceSnapshots[account][lastIndex].balance = balance_;
        return;
      }
    }

    BalanceSnapshot memory balanceSnapshot;

    balanceSnapshot.snapshotId = snapshotId;
    balanceSnapshot.balance = balance_;

    _balanceSnapshots[account].push(balanceSnapshot);
  }
}
