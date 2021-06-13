// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./components/Controlled.sol";
import "./components/Initializable.sol";
import "./libs/MathLib.sol";
import "./HEROToken.sol";


/**
 * @title HERO presale
 */
contract HEROPresale is Controlled, Initializable {
  using MathLib for uint256;

  // defaults
  uint256 private constant DEFAULT_DEADLINE_IN = 7 * 24 * 60 * 60; // 7 days

  HEROToken public token;

  mapping (address => bool) public whitelist;

  uint256 public deadline;
  uint256 public unitPrice;
  uint256 public unitTokens;
  uint256 public pendingAccounts;
  uint256 public pendingTokens;

  // events

  event DeadlineUpdated(
    uint256 deadline
  );

  event AccountAdded(
    address indexed account
  );

  event UnitBought(
    address indexed account
  );

  /**
   * @dev Public constructor
   */
  constructor ()
    public
    Controlled()
    Initializable()
  {}

  // external functions (payable)

  function buyUnit()
    external
    payable
  {
    require(
      block.timestamp < deadline, // solhint-disable-line not-rely-on-time
      "HEROPresale: can not buy after deadline"
    );

    require(
      whitelist[msg.sender],
      "HEROPresale: msg.sender not on the whitelist"
    );
    require(
      msg.value == unitPrice,
      "HEROPresale: invalid msg.value"
    );

    whitelist[msg.sender] = false;

    pendingAccounts = pendingAccounts.sub(1);
    pendingTokens = pendingTokens.sub(unitTokens);

    token.transfer(
      msg.sender,
      unitTokens
    );

    emit UnitBought(
      msg.sender
    );
  }

  // external functions

  function initialize(
    address payable token_,
    uint256 deadlineIn_, // in seconds
    uint256 unitPrice_,
    uint256 unitTokens_,
    address[] calldata accounts
  )
    external
    onlyInitializer
  {
    require(
      token_ != address(0),
      "HEROPresale: token is the zero address"
    );
    require(
      unitPrice_ != 0,
      "HEROPresale: invalid unit price"
    );
    require(
      unitTokens_ != 0,
      "HEROPresale: invalid unit tokens"
    );

    token = HEROToken(token_);

    unitPrice = unitPrice_;
    unitTokens = unitTokens_;

    _updateDeadline(deadlineIn_ != 0
      ? deadlineIn_
      : DEFAULT_DEADLINE_IN
    );

    if (accounts.length != 0) {
      _addAccounts(accounts);
    }
  }

  function updateDeadline(
    uint256 deadlineIn_ // in seconds
  )
    external
    onlyController
  {
    _updateDeadline(deadlineIn_);
  }

  function addAccounts(
    address[] calldata accounts
  )
    external
    onlyController
  {
    _addAccounts(accounts);
  }

  function destroy()
    external
    onlyController
  {
    require(
      block.timestamp >= deadline, // solhint-disable-line not-rely-on-time
      "HEROPresale: can not destroy before deadline"
    );

    uint256 pendingTokens_ = token.balanceOf(address(this));

    if (pendingTokens_ != 0) {
      token.burn(
        pendingTokens_
      );
    }

    selfdestruct(msg.sender);
  }

  // private functions

  function _updateDeadline(
    uint256 deadlineIn_
  )
    private
  {
    deadline = block.timestamp.add(deadlineIn_); // solhint-disable-line not-rely-on-time

    emit DeadlineUpdated(
      deadline
    );
  }

  function _addAccounts(
    address[] memory accounts
  )
    private
  {
    uint256 pendingAccounts_;
    uint256 pendingTokens_;

    uint256 accountsLen = accounts.length;

    for (uint256 index = 0 ; index < accountsLen ; index += 1) {
      require(
        accounts[index] != address(0),
        "HEROPresale: account is the zero address"
      );

      if (!whitelist[accounts[index]]) {
        whitelist[accounts[index]] = true;

        pendingAccounts_ = pendingAccounts_.add(1);
        pendingTokens_ = pendingTokens_.add(unitTokens);

        emit AccountAdded(
          accounts[index]
        );
      }
    }

    require(
      pendingAccounts_ != 0,
      "HEROPresale: empty accounts"
    );

    pendingAccounts = pendingAccounts.add(pendingAccounts_);
    pendingTokens = pendingTokens.add(pendingTokens_);

    require(
      pendingTokens <= token.balanceOf(address(this)),
      "HEROPresale: pending tokens exceeds balance"
    );
  }
}
