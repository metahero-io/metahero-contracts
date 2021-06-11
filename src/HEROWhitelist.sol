// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./components/Controlled.sol";
import "./components/Initializable.sol";
import "./libs/MathLib.sol";
import "./HEROToken.sol";


/**
 * @title HERO whitelist
 */
contract HEROWhitelist is Controlled, Initializable {
  using MathLib for uint256;

  // defaults
  uint256 private constant DEFAULT_DEADLINE_IN = 7 * 24 * 60 * 60; // 7 days

  HEROToken public token;

  mapping (address => bool) public whitelist;

  uint256 public deadline;
  uint256 public claimUnitPrice;
  uint256 public claimUnitTokens;
  uint256 public unclaimedAccounts;
  uint256 public unclaimedTokens;

  // events

  event AccountAdded(
    address indexed account
  );

  event TokensClaimed(
    address indexed account
  );

  /**
   * @dev Public constructor
   */
  constructor ()
    public
    Controlled()
    Initializable()
  {
    //
  }

  // external functions

  function initialize(
    address payable token_,
    uint256 deadlineIn_, // in seconds
    uint256 claimUnitPrice_,
    uint256 claimUnitTokens_,
    address[] calldata accounts
  )
    external
    onlyInitializer
  {
    require(
      token_ != address(0),
      "HEROWhitelist: token is the zero address"
    );
    require(
      claimUnitPrice_ != 0,
      "HEROWhitelist: invalid claim unit price"
    );
    require(
      claimUnitTokens_ != 0,
      "HEROWhitelist: invalid claim unit tokens"
    );

    token = HEROToken(token_);

    deadline = block.timestamp.add(
      deadlineIn_ != 0
        ? deadlineIn_
        : DEFAULT_DEADLINE_IN
    );

    claimUnitPrice = claimUnitPrice_;
    claimUnitTokens = claimUnitTokens_;

    _addAccounts(accounts);
  }

  function addAccounts(
    address[] calldata accounts
  )
    onlyController
    external
  {
    _addAccounts(accounts);
  }

  function claimTokens()
    external
    payable
  {
    require(
      block.timestamp < deadline,
      "HEROWhitelist: can not claim tokens after deadline"
    );
    require(
      whitelist[msg.sender],
      "HEROWhitelist: msg.sender not on the whitelist"
    );
    require(
      msg.value != claimUnitPrice,
      "HEROWhitelist: invalid msg.value"
    );

    whitelist[msg.sender] = false;

    unclaimedAccounts = unclaimedAccounts.sub(1);
    unclaimedTokens = unclaimedTokens.sub(claimUnitTokens);

    token.transfer(
      msg.sender,
      claimUnitTokens
    );

    TokensClaimed(
      msg.sender
    );
  }

  function destroy()
    onlyController
    external
  {
    require(
      block.timestamp >= deadline,
      "HEROWhitelist: can not destroy before deadline"
    );

    if (unclaimedTokens != 0) {
      token.transfer(
        msg.sender,
        token.balanceOf(address(this))
      );
    }

    selfdestruct(msg.sender);
  }

  // private functions

  function _addAccounts(
    address[] memory accounts
  )
    private
  {
    uint256 unclaimedAccounts_;
    uint256 unclaimedTokens_;

    uint256 accountsLen = accounts.length;

    for (uint256 index = 0 ; index < accountsLen ; index += 1) {
      require(
        accounts[index] != address(0),
        "HEROWhitelist: account is the zero address"
      );

      if (!whitelist[accounts[index]]) {
        whitelist[accounts[index]] = true;

        unclaimedAccounts_ = unclaimedAccounts_.add(1);
        unclaimedTokens_ = unclaimedTokens_.add(claimUnitTokens);

        emit AccountAdded(
          accounts[index]
        );
      }
    }

    require(
      unclaimedAccounts_ != 0,
      "HEROWhitelist: empty accounts"
    );

    unclaimedAccounts = unclaimedAccounts.add(unclaimedAccounts_);
    unclaimedTokens = unclaimedTokens.add(unclaimedTokens_);

    require(
      unclaimedTokens <= token.balanceOf(address(this)),
      "HEROWhitelist: unclaimed tokens exceeds balance"
    );
  }
}
