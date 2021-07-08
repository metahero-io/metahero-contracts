// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "./core/lifecycle/Initializable.sol";
import "./core/math/SafeMathLib.sol";
import "./MetaheroTimeLockWallet.sol";
import "./MetaheroToken.sol";


/**
 * @title Metahero time lock registry
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
contract MetaheroTimeLockRegistry is Initializable {
  using SafeMathLib for uint256;

  struct TimeLock {
    address spender;
    uint256 amount;
    uint256 deadline;
  }

  /**
   * @return token address
   */
  MetaheroToken public token;

  mapping (address => address) private claimerWallets;
  mapping (address => TimeLock[]) private claimerTimeLocks;

  // events

  /**
   * @dev Emitted when the contract is initialized
   * @param token token address
   */
  event Initialized(
    address token
  );

  /**
   * @dev Emitted when the claimer wallet is created
   * @param claimer claimer address
   * @param claimerWallet claimer wallet address
   */
  event ClaimerWalletCreated(
    address indexed claimer,
    address claimerWallet
  );

  /**
   * @dev Emitted when tokens are locked
   * @param spender spender address
   * @param claimer claimer address
   * @param claimerWallet claimer wallet address
   * @param amount tokens amount
   * @param deadline deadline in seconds
   */
  event TokensLocked(
    address indexed spender,
    address indexed claimer,
    address claimerWallet,
    uint256 amount,
    uint256 deadline
  );

  /**
   * @dev Emitted when tokens are unlocked
   * @param spender spender address
   * @param claimer claimer address
   * @param claimerWallet claimer wallet address
   * @param recipient recipient address
   * @param amount tokens amount
   * @param deadline deadline in seconds
   */
  event TokensUnlocked(
    address indexed spender,
    address indexed claimer,
    address claimerWallet,
    address recipient,
    uint256 amount,
    uint256 deadline
  );

  /**
   * @dev Public constructor
   */
  constructor ()
    public
    Initializable()
  {
    //
  }

  // external functions

  /**
   * @dev Initializes the contract
   * @param token_ token address
   */
  function initialize(
    address token_
  )
    external
    onlyInitializer
  {
    require(
      token_ != address(0),
      "MetaheroTimeLockRegistry#1" // token is the zero address
    );

    token = MetaheroToken(token_);

    emit Initialized(
      token_
    );
  }

  /**
   * @dev Creates claimer wallet
   * @param claimer claimer address
   */
  function createClaimerWallet(
    address claimer
  )
    external
  {
    require(
      claimer != address(0),
      "MetaheroTimeLockRegistry#2" // claimer is the zero address
    );

    require(
      claimerWallets[claimer] == address(0),
      "MetaheroTimeLockRegistry#3" // claimer wallet already created
    );

    _createClaimerWallet(claimer);
  }

  /**
   * @dev Locks tokens to claimer
   * @param claimer claimer address
   * @param amount tokens amount
   * @param unlockedIn seconds to unlock
   */
  function lockTokensTo(
    address claimer,
    uint256 amount,
    uint256 unlockedIn
  )
    external
  {
    _lockTokens(
      msg.sender,
      claimer,
      amount,
      unlockedIn
    );
  }

  /**
   * @dev Locks own tokens
   * @param amount tokens amount
   * @param unlockedIn seconds to unlock
   */
  function lockTokens(
    uint256 amount,
    uint256 unlockedIn
  )
    external
  {
    _lockTokens(
      msg.sender,
      msg.sender,
      amount,
      unlockedIn
    );
  }

  /**
   * @dev Claims tokens
   */
  function claimTokens()
    external
  {
    _claimTokens(
      msg.sender,
      msg.sender
    );
  }

  /**
   * @dev Claims tokens to recipient
   * @param recipient recipient address
   */
  function claimTokensTo(
    address recipient
  )
    external
  {
    _claimTokens(
      msg.sender,
      recipient
    );
  }

  // external functions (views)

  /**
   * @dev Computes claimer wallet
   * @param claimer claimer address
   * @return result claimer wallet address
   */
  function computeClaimerWallet(
    address claimer
  )
    external
    view
    returns (address result)
  {
    if (claimer != address(0)) {
      if (claimerWallets[claimer] != address(0)) {
        result = claimerWallets[claimer];
      } else {
        bytes32 salt = keccak256(abi.encodePacked(claimer));

        bytes memory creationCode = abi.encodePacked(
          type(MetaheroTimeLockWallet).creationCode,
          bytes12(0),
          address(token)
        );

        bytes32 hash = keccak256(
          abi.encodePacked(
            bytes1(0xff),
            address(this),
            salt,
            keccak256(creationCode)
          )
        );

        return address(uint160(uint256(hash)));
      }
    }

    return result;
  }

  /**
   * @dev Gets claimer time locks
   * @param claimer claimer address
   * @return array of time locks
   */
  function getClaimerTimeLocks(
    address claimer
  )
    external
    view
    returns (TimeLock[] memory)
  {
    return claimerTimeLocks[claimer];
  }

  // private functions

  function _createClaimerWallet(
    address claimer
  )
    private
  {
    bytes32 salt = keccak256(abi.encodePacked(claimer));

    address claimerWallet = address(new MetaheroTimeLockWallet{salt: salt}(
        address(token)
      ));

    claimerWallets[claimer] = claimerWallet;

    emit ClaimerWalletCreated(
      claimer,
      claimerWallet
    );
  }

  function _lockTokens(
    address spender,
    address claimer,
    uint256 amount,
    uint256 unlockedIn
  )
    private
  {
    require(
      claimer != address(0),
      "MetaheroTimeLockRegistry#4" // claimer is the zero address
    );

    require(
      amount != 0,
      "MetaheroTimeLockRegistry#5" // amount is zero
    );

    // create claimer wallet if not created yet
    if (claimerWallets[claimer] == address(0)) {
      _createClaimerWallet(claimer);
    }

    uint256 deadline = block.timestamp.add(unlockedIn); // solhint-disable-line not-rely-on-time

    address claimerWallet = claimerWallets[claimer];

    bool excluded;

    if (spender != claimer) {
      (excluded,,) = token.getExcludedAccount(spender);

      require(
        excluded,
        "MetaheroTimeLockRegistry#6" // spender is not the excluded account
      );
    }

    (excluded,,) = token.getExcludedAccount(claimer);

    require(
      excluded,
      "MetaheroTimeLockRegistry#7" // claimer is not the excluded account
    );

    (excluded,,) = token.getExcludedAccount(claimerWallet);

    require(
      excluded,
      "MetaheroTimeLockRegistry#8" // claimer wallet is not the excluded account
    );

    token.transferFrom(
      spender,
      claimerWallet,
      amount
    );

    TimeLock memory timeLock;

    timeLock.spender = spender;
    timeLock.amount = amount;
    timeLock.deadline = deadline;

    claimerTimeLocks[claimer].push(timeLock);

    emit TokensLocked(
      spender,
      claimer,
      claimerWallet,
      amount,
      deadline
    );
  }

  function _claimTokens(
    address claimer,
    address recipient
  )
    private
  {
    require(
      claimerWallets[claimer] != address(0),
      "MetaheroTimeLockRegistry#9" // claimer wallet doesn't exist
    );

    require(
      recipient != address(0),
      "MetaheroTimeLockRegistry#10" // claimer is the zero address
    );

    if (recipient != claimer) {
      (bool excluded,,) = token.getExcludedAccount(recipient);

      require(
        excluded,
        "MetaheroTimeLockRegistry#11" // recipient is not the excluded account
      );
    }

    uint256 amount;
    uint256 len = claimerTimeLocks[claimer].length;

    if (len != 0) {
      uint256 lastIndex = len - 1;

      TimeLock memory timeLock;

      for (uint256 index; index <= lastIndex; ) {
        timeLock = claimerTimeLocks[claimer][index];

        if (timeLock.deadline <= block.timestamp) { // solhint-disable-line not-rely-on-time
          if (index != lastIndex) {
            claimerTimeLocks[claimer][index] = claimerTimeLocks[claimer][lastIndex];
            lastIndex--;
          } else {
            index++;
          }

          amount = amount.add(timeLock.amount);

          emit TokensUnlocked(
            timeLock.spender,
            claimer,
            claimerWallets[claimer],
            recipient,
            timeLock.amount,
            timeLock.deadline
          );

          claimerTimeLocks[claimer].pop();
        } else {
          index++;
        }
      }
    }

    require(
      amount != 0,
      "MetaheroTimeLockRegistry#12" // amount is zero
    );

    MetaheroTimeLockWallet(claimerWallets[claimer]).transferTokens(recipient, amount);
  }
}
