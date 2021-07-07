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
    uint256 expectedClaimerWalletBalance = token.balanceOf(claimerWallet).add(amount);

    token.transferFrom(
      msg.sender,
      claimerWallet,
      amount
    );

    require(
      token.balanceOf(claimerWallet) == expectedClaimerWalletBalance,
      "MetaheroTimeLockRegistry#6" // invalid claimer wallet balance after transfer
    );

    TimeLock memory timeLock;

    timeLock.spender = msg.sender;
    timeLock.amount = amount;
    timeLock.deadline = deadline;

    claimerTimeLocks[claimer].push(timeLock);

    emit TokensLocked(
      msg.sender,
      claimer,
      claimerWallet,
      amount,
      deadline
    );
  }

  function _claimTokens(
    address recipient
  )
    private
  {
    require(
      claimerWallets[msg.sender] != address(0),
      "MetaheroTimeLockRegistry#7" // claimer wallet doesn't exist
    );

    require(
      recipient != address(0),
      "MetaheroTimeLockRegistry#8" // claimer is the zero address
    );


    uint256 amount;
    uint256 len = claimerTimeLocks[msg.sender].length;

    if (len != 0) {
      uint256 lastIndex = len - 1;

      TimeLock memory timeLock;

      for (uint256 index; index <= lastIndex; ) {
        timeLock = claimerTimeLocks[msg.sender][index];

        if (timeLock.deadline <= block.timestamp) { // solhint-disable-line not-rely-on-time
          if (index != lastIndex) {
            claimerTimeLocks[msg.sender][index] = claimerTimeLocks[msg.sender][lastIndex];
            lastIndex--;
          } else {
            index++;
          }

          amount = amount.add(timeLock.amount);

          emit TokensUnlocked(
            timeLock.spender,
            msg.sender,
            claimerWallets[msg.sender],
            recipient,
            timeLock.amount,
            timeLock.deadline
          );

          claimerTimeLocks[msg.sender].pop();
        } else {
          index++;
        }
      }
    }

    require(
      amount != 0,
      "MetaheroTimeLockRegistry#9" // amount is zero
    );

    uint256 expectedRecipientBalance = token.balanceOf(recipient).add(amount);

    MetaheroTimeLockWallet(claimerWallets[msg.sender]).transferTokens(recipient, amount);

    require(
      token.balanceOf(recipient) == expectedRecipientBalance,
      "MetaheroTimeLockRegistry#11" // invalid recipient balance after transfer
    );
  }
}
