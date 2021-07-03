// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./core/access/Owned.sol";
import "./core/lifecycle/Initializable.sol";
import "./core/math/SafeMathLib.sol";
import "./MetaheroToken.sol";


/**
 * @title Metahero presale
 *
 * @author Stanisław Głogowski <stan@metaMetahero.io>
 */
contract MetaheroPresale is Owned, Initializable {
  using SafeMathLib for uint256;

  struct Settings {
    uint256 tokensAmountPerNative;
    uint256 minPurchasePrice; // min purchase price per whitelisted account
    uint256 maxPurchasePrice; // max purchase price per whitelisted account
  }

  struct Summary {
    uint256 totalAccounts;
    uint256 totalTokens;
  }

  MetaheroToken public token;
  Settings public settings;
  Summary public summary;
  bool public started;

  mapping (address => bool) public whitelist;

  // events

  event Initialized(
    address token,
    uint256 tokensAmountPerNative,
    uint256 minPurchasePrice,
    uint256 maxPurchasePrice
  );

  event PresaleStarted();

  event TokensPurchased(
    address indexed account,
    uint256 tokensPrice,
    uint256 tokensAmount
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
     started,
      "MetaheroPresale#1"
    );

    require(
      whitelist[msg.sender],
      "MetaheroPresale#2"
    );

    require(
      msg.value != 0,
      "MetaheroPresale#3"
    );

    require(
      msg.value >= settings.minPurchasePrice,
      "MetaheroPresale#4"
    );

    require(
      msg.value <= settings.maxPurchasePrice,
      "MetaheroPresale#5"
    );

    uint256 tokensAmount = msg.value.mul(settings.tokensAmountPerNative);

    require(
      tokensAmount <= summary.totalTokens,
      "MetaheroPresale#6"
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
    uint256 minPurchasePrice,
    uint256 maxPurchasePrice
  )
    external
    onlyInitializer
  {
    require(
      token_ != address(0),
      "MetaheroPresale#7"
    );

    require(
      tokensAmountPerNative != 0,
      "MetaheroPresale#8"
    );

    require(
      minPurchasePrice <= maxPurchasePrice,
      "MetaheroPresale#9"
    );

    require(
      maxPurchasePrice != 0,
      "MetaheroPresale#10"
    );

    token = MetaheroToken(token_);

    settings.tokensAmountPerNative = tokensAmountPerNative;
    settings.minPurchasePrice = minPurchasePrice;
    settings.maxPurchasePrice = maxPurchasePrice;

    summary.totalTokens = token.balanceOf(address(this));

    emit Initialized(
      token_,
      tokensAmountPerNative,
      minPurchasePrice,
      maxPurchasePrice
    );
  }

  function startPresale()
    external
    onlyOwner
  {
    require(
      !started,
      "MetaheroPresale#11"
    );

    started = true;

    emit PresaleStarted();
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
        "MetaheroPresale#12"
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
      "MetaheroPresale#13"
    );

    summary.totalAccounts = summary.totalAccounts.sub(totalRemoved);
  }

  function finishPresale()
    external
    onlyOwner
  {
    uint256 totalTokens = token.balanceOf(address(this));

    if (totalTokens != 0) {
      token.burn(
        totalTokens
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
    uint256 totalAdded;
    uint256 accountsLen = accounts.length;

    for (uint256 index ; index < accountsLen ; index++) {
      require(
        accounts[index] != address(0),
        "MetaheroPresale#14"
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
      "MetaheroPresale#15"
    );

    summary.totalAccounts = summary.totalAccounts.add(totalAdded);
  }
}
