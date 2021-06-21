// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./access/Owned.sol";
import "./lifecycle/Initializable.sol";
import "./math/MathLib.sol";
import "./HEROToken.sol";


/**
 * @title HERO presale
 */
contract HEROPresale is Owned, Initializable {
  using MathLib for uint256;

  struct Settings {
    uint256 tokensAmountPerNative;
    uint256 maxPurchasePrice; // max purchase price per whitelisted account
  }

  struct Summary {
    uint256 totalAccounts;
    uint256 totalTokens;
  }

  HEROToken public token;
  Settings public settings;
  Summary public summary;
  uint256 public deadline;

  mapping (address => bool) public whitelist;

  // events

  event TokensPurchased(
    address indexed account,
    uint256 tokensPrice,
    uint256 tokensAmount
  );

  event SettingsUpdated(
    uint256 tokensAmountPerNative,
    uint256 maxPurchasePrice
  );

  event DeadlineUpdated(
    uint256 deadline
  );

  event AccountAdded(
    address indexed account
  );

  event AccountRemoved(
    address indexed account
  );

  /**
   * @dev Public constructor
   */
  constructor ()
    public
    Owned()
    Initializable()
  {
    //
  }

  // external functions

  receive()
    external
    payable
  {
    require(
      block.timestamp < deadline, // solhint-disable-line not-rely-on-time
      "HEROPresale#1"
    );

    require(
      whitelist[msg.sender],
      "HEROPresale#2"
    );

    require(
      msg.value != 0,
      "HEROPresale#3"
    );

    require(
      msg.value <= settings.maxPurchasePrice,
      "HEROPresale#4"
    );

    uint256 tokensAmount = msg.value.mul(settings.tokensAmountPerNative);

    require(
      tokensAmount <= summary.totalTokens,
      "HEROPresale#5"
    );

    whitelist[msg.sender] = false;

    summary.totalAccounts = summary.totalAccounts.sub(1);
    summary.totalTokens = summary.totalTokens.sub(tokensAmount);

    token.transfer(
      msg.sender,
      tokensAmount
    );

    emit TokensPurchased(
      msg.sender,
      msg.value,
      tokensAmount
    );
  }

  function initialize(
    address payable token_,
    uint256 tokensAmountPerNative,
    uint256 maxPurchasePrice,
    uint256 deadlineIn // in seconds
  )
    external
    onlyInitializer
  {
    require(
      token_ != address(0),
      "HEROPresale#6"
    );

    token = HEROToken(token_);

    summary.totalTokens = token.balanceOf(address(this));

    _updateSettings(
      tokensAmountPerNative,
      maxPurchasePrice
    );

    _updateDeadline(deadlineIn);
  }

  function updateSettings(
    uint256 tokensAmountPerNative,
    uint256 maxPurchasePrice
  )
    external
    onlyOwner
  {
    _updateSettings(
      tokensAmountPerNative,
      maxPurchasePrice
    );
  }

  function updateDeadline(
    uint256 deadlineIn_ // in seconds
  )
    external
    onlyOwner
  {
    _updateDeadline(deadlineIn_);
  }

  function syncTotalTokens()
    external
  {
    summary.totalTokens = token.balanceOf(address(this));
  }

  function addAccounts(
    address[] calldata accounts
  )
    external
    onlyOwner
  {
    _addAccounts(accounts);
  }

  function removeAccounts(
    address[] calldata accounts
  )
    external
    onlyOwner
  {
    uint256 totalRemoved;
    uint256 accountsLen = accounts.length;

    for (uint256 index ; index < accountsLen ; index++) {
      require(
        accounts[index] != address(0),
        "HEROPresale#7"
      );

      if (whitelist[accounts[index]]) {
        whitelist[accounts[index]] = false;

        totalRemoved = totalRemoved.add(1);

        emit AccountRemoved(
          accounts[index]
        );
      }
    }

    require(
      totalRemoved != 0,
      "HEROPresale#8"
    );

    summary.totalAccounts = summary.totalAccounts.sub(totalRemoved);
  }

  function finishPresale()
    external
    onlyOwner
  {
    require(
      block.timestamp >= deadline, // solhint-disable-line not-rely-on-time
      "HEROPresale#9"
    );

    uint256 totalTokens = token.balanceOf(address(this));

    if (totalTokens != 0) {
      token.burn(
        totalTokens
      );
    }

    selfdestruct(msg.sender);
  }

  // private functions

  function _updateSettings(
    uint256 tokensAmountPerNative,
    uint256 maxPurchasePrice
  )
    private
  {
    require(
      tokensAmountPerNative != 0,
      "HEROPresale#10"
    );

    require(
      maxPurchasePrice != 0,
      "HEROPresale#11"
    );

    settings.tokensAmountPerNative = tokensAmountPerNative;
    settings.maxPurchasePrice = maxPurchasePrice;

    emit SettingsUpdated(
      tokensAmountPerNative,
      maxPurchasePrice
    );
  }

  function _updateDeadline(
    uint256 deadlineIn
  )
    private
  {
    deadline = block.timestamp.add(deadlineIn); // solhint-disable-line not-rely-on-time

    emit DeadlineUpdated(
      deadline
    );
  }

  function _addAccounts(
    address[] memory accounts
  )
    private
  {
    uint256 totalAdded;
    uint256 accountsLen = accounts.length;

    for (uint256 index ; index < accountsLen ; index++) {
      require(
        accounts[index] != address(0),
        "HEROPresale#12"
      );

      if (!whitelist[accounts[index]]) {
        whitelist[accounts[index]] = true;

        totalAdded = totalAdded.add(1);

        emit AccountAdded(
          accounts[index]
        );
      }
    }

    require(
      totalAdded != 0,
      "HEROPresale#13"
    );

    summary.totalAccounts = summary.totalAccounts.add(totalAdded);
  }
}
