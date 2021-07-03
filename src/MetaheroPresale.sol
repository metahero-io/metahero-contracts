// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./core/access/Owned.sol";
import "./core/lifecycle/Initializable.sol";
import "./core/math/SafeMathLib.sol";
import "./MetaheroToken.sol";


/**
 * @title Metahero presale
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
contract MetaheroPresale is Owned, Initializable {
  using SafeMathLib for uint256;

  struct Settings {
    uint256 tokensAmountPerNative;
    uint256 minPurchasePrice; // min purchase price per whitelisted account
    uint256 maxPurchasePrice; // max purchase price per whitelisted account
  }

  struct Summary {
    uint256 totalAccounts; // total accounts in presale
    uint256 totalTokens; // total tokens in presale
  }

  /**
   * @return token address
   */
  MetaheroToken public token;

  /**
   * @return settings object
   */
  Settings public settings;

  /**
   * @return summary object
   */
  Summary public summary;

  /**
   * @return true when presale started
   */
  bool public started;

  /**
   * @return map with whitelisted accounts
   */
  mapping (address => bool) public whitelist;

  // events

  /**
   * @dev Emitted the contract is initialized
   * @param token token address
   * @param tokensAmountPerNative tokens amount per native
   * @param minPurchasePrice min purchase price in native
   * @param maxPurchasePrice max purchase price in native
   */
  event Initialized(
    address token,
    uint256 tokensAmountPerNative,
    uint256 minPurchasePrice,
    uint256 maxPurchasePrice
  );

  /**
   * @dev Emitted after the presale starts
   */
  event PresaleStarted();

  /**
   * @dev Emitted after purchasing tokens
   * @param account account address
   * @param tokensPrice tokens price
   * @param tokensAmount tokens amount
   */
  event TokensPurchased(
    address indexed account,
    uint256 tokensPrice,
    uint256 tokensAmount
  );

  /**
   * @dev Emitted after account is added to the whitelist
   * @param account account address
   */
  event AccountAdded(
    address indexed account
  );

  /**
   * @dev Emitted after account is removed from the whitelist
   * @param account account address
   */
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

  /**
   * @dev Alias for buyTokens
   */
  receive()
    external
    payable
  {
    _buyTokens(
      msg.sender,
      msg.value
    );
  }

  /**
   * @dev Starts the process of buying tokens
   */
  function buyTokens()
    external
    payable
  {
    _buyTokens(
      msg.sender,
      msg.value
    );
  }

  /**
   * @dev Initializes the contract
   * @param token_ token address
   * @param tokensAmountPerNative tokens amount per native
   * @param minPurchasePrice min purchase price
   * @param maxPurchasePrice max purchase price
   */
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
      "MetaheroPresale#7" // token is the zero address
    );

    require(
      tokensAmountPerNative != 0,
      "MetaheroPresale#8" // tokens amount per native is zero
    );

    require(
      minPurchasePrice <= maxPurchasePrice,
      "MetaheroPresale#9" // max purchase price is lower than min
    );

    require(
      maxPurchasePrice != 0,
      "MetaheroPresale#10" // max purchase price is zero
    );

    token = MetaheroToken(token_);

    settings.tokensAmountPerNative = tokensAmountPerNative;
    settings.minPurchasePrice = minPurchasePrice;
    settings.maxPurchasePrice = maxPurchasePrice;

    // sync balance
    summary.totalTokens = token.balanceOf(address(this));

    emit Initialized(
      token_,
      tokensAmountPerNative,
      minPurchasePrice,
      maxPurchasePrice
    );
  }

  /**
   * @dev Starts the presale
   */
  function startPresale()
    external
    onlyOwner
  {
    require(
      !started,
      "MetaheroPresale#11" // presale already started
    );

    started = true;

    emit PresaleStarted();
  }

  /**
   * @dev Syncs total tokens
   */
  function syncTotalTokens()
    external
  {
    summary.totalTokens = token.balanceOf(address(this));
  }

  /**
   * @dev Adds accounts to the whitelist
   * @param accounts array of accounts addresses
   */
  function addAccounts(
    address[] calldata accounts
  )
    external
    onlyOwner
  {
    _addAccounts(accounts);
  }

  /**
   * @dev Removes accounts from the whitelist
   * @param accounts array of accounts addresses
   */
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
        "MetaheroPresale#12" // account is the zero address
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
      "MetaheroPresale#13" // no accounts to remove
    );

    summary.totalAccounts = summary.totalAccounts.sub(totalRemoved);
  }

  /**
   * @dev Finishes the presale
   */
  function finishPresale()
    external
    onlyOwner
  {
    uint256 totalTokens = token.balanceOf(address(this));

    if (totalTokens != 0) {
      // burn all pending presale tokens
      token.burn(
        totalTokens
      );
    }

    selfdestruct(msg.sender); // destroy and transfer all native to the sender
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
        "MetaheroPresale#14" // account is the zero address
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
      "MetaheroPresale#15" // not accounts to add
    );

    summary.totalAccounts = summary.totalAccounts.add(totalAdded);
  }

  function _buyTokens(
    address sender,
    uint256 tokensPrice
  )
    private
  {
    require(
      started,
      "MetaheroPresale#1" // the presale has not started
    );

    require(
      whitelist[sender],
      "MetaheroPresale#2" // sender not on the whitelist
    );

    require(
      tokensPrice != 0,
      "MetaheroPresale#3" // token prize is zero
    );

    require(
      tokensPrice >= settings.minPurchasePrice,
      "MetaheroPresale#4" // token prize is too low
    );

    require(
      tokensPrice <= settings.maxPurchasePrice,
      "MetaheroPresale#5" // token prize is too high
    );

    uint256 tokensAmount = tokensPrice.mul(settings.tokensAmountPerNative);

    require(
      tokensAmount <= summary.totalTokens,
      "MetaheroPresale#6" // not enough tokens in presale
    );

    // remove sender from the whitelist
    whitelist[sender] = false;

    // update summary
    summary.totalAccounts = summary.totalAccounts.sub(1);
    summary.totalTokens = summary.totalTokens.sub(tokensAmount);

    token.transfer(
      sender,
      tokensAmount
    );

    emit TokensPurchased(
      sender,
      tokensPrice,
      tokensAmount
    );
  }
}
