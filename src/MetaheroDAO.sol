// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "./core/lifecycle/Initializable.sol";
import "./core/math/MathLib.sol";
import "./core/math/SafeMathLib.sol";
import "./IMetaheroDAO.sol";
import "./MetaheroToken.sol";


/**
 * @title Metahero DAO
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
contract MetaheroDAO is Initializable, IMetaheroDAO {
  using MathLib for uint256;
  using SafeMathLib for uint256;

  struct Settings {
    uint256 minVotingPeriod;
    uint256 snapshotWindow;
  }

  struct Proposal {
    uint256 snapshotId;
    bytes callData;
    uint256 startsAt;
    uint256 endsAt;
    bool processed;
    uint256 votesMinPercentage;
    uint256 votesMinWeight;
    uint256 votesYesWeight;
    uint256 votesNoWeight;
    uint256 votesCount;
    mapping (address => uint8) votes; // 1 - yes, 2 - no
  }

  struct WeightsHistory {
    uint256[] weights;
    uint256[] snapshotIds;
  }

  // globals

  uint256 private constant MAX_VOTES_MIN_PERCENTAGE = 75; // 75%

  /**
   * @return operator address
   */
  address public operator;

  /**
   * @return token address
   */
  MetaheroToken public token;

  /**
   * @return settings object
   */
  Settings public settings;

  mapping(uint256 => Proposal) private proposals;
  mapping(address => WeightsHistory) private membersWeightsHistory;
  WeightsHistory private totalWeightsHistory;
  uint256 private proposalCounter;
  uint256 private snapshotBaseTimestamp;

  // events

  /**
   * @dev Emitted the contract is initialized
   * @param token token address
   * @param operator operator address
   * @param minVotingPeriod min voting period
   * @param snapshotWindow snapshot window
   * @param snapshotBaseTimestamp snapshot base timestamp
   */
  event Initialized(
    address token,
    address operator,
    uint256 minVotingPeriod,
    uint256 snapshotWindow,
    uint256 snapshotBaseTimestamp
  );

  /**
   * @dev Emitted the proposal is created
   * @param proposalId proposal id
   * @param callData token call data
   * @param snapshotId snapshot id
   * @param startsAt starts at
   * @param endsAt ends at
   * @param votesMinPercentage votes min percentage
   * @param votesMinWeight votes min weight
   */
  event ProposalCreated(
    uint256 proposalId,
    uint256 snapshotId,
    bytes callData,
    uint256 startsAt,
    uint256 endsAt,
    uint256 votesMinPercentage,
    uint256 votesMinWeight
  );

  /**
   * @dev Emitted the proposal is processed
   * @param proposalId proposal id
   * @param votesYesWeight votes yes weight
   * @param votesNoWeight votes no weight
   */
  event ProposalProcessed(
    uint256 proposalId,
    uint256 votesYesWeight,
    uint256 votesNoWeight
  );

  /**
   * @dev Emitted the vote is submitted
   * @param proposalId proposal id
   * @param member member address
   * @param vote where `1` eq yes and `2` eq no
   */
  event VoteSubmitted(
    uint256 proposalId,
    address member,
    uint8 vote
  );

  // modifiers

  /**
   * @dev Throws if msg.sender is not the operator
   */
  modifier onlyOperator() {
    require(
      msg.sender == operator,
      "MetaheroDAO#1" // msg.sender is not the operator
    );

    _;
  }

  /**
   * @dev Throws if msg.sender is not the token
   */
  modifier onlyToken() {
    require(
      msg.sender == address(token),
      "MetaheroDAO#2" // msg.sender is not the token
    );

    _;
  }

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
   * @param operator_ custom operator address
   * @param minVotingPeriod min voting period
   * @param snapshotWindow snapshot window
   */
  function initialize(
    address token_,
    address operator_,
    uint256 minVotingPeriod,
    uint256 snapshotWindow
  )
    external
    onlyInitializer
  {
    require(
      token_ != address(0),
      "MetaheroDAO#3" // token is the zero address
    );

    require(
      minVotingPeriod != 0,
      "MetaheroDAO#4" // min voting period is zero
    );

    require(
      snapshotWindow != 0,
      "MetaheroDAO#5" // snapshot window is zero
    );

    token = MetaheroToken(token_);

    if (operator_ == address(0)) {
      operator_ = token.owner();
    }

    operator = operator_;

    settings.minVotingPeriod = minVotingPeriod;
    settings.snapshotWindow = snapshotWindow;

    snapshotBaseTimestamp = block.timestamp; // solhint-disable-line not-rely-on-time

    emit Initialized(
      token_,
      operator_,
      minVotingPeriod,
      snapshotWindow,
      snapshotBaseTimestamp
    );
  }

  /**
   * @notice Called by a token to sync a dao member
   * @param member member address
   * @param memberWeight member weight
   * @param totalWeight all members weight
   */
  function syncMember(
    address member,
    uint256 memberWeight,
    uint256 totalWeight
  )
    external
    onlyToken
    override
  {
    uint256 snapshotId = _getSnapshotIdAt(block.timestamp); // solhint-disable-line not-rely-on-time

    _setMemberWeight(
      member,
      memberWeight,
      snapshotId
    );

    _setTotalWeight(
      totalWeight,
      snapshotId
    );
  }

  /**
   * @notice Called by a token to sync a dao members
   * @param memberA member A address
   * @param memberAWeight member A weight
   * @param memberB member B address
   * @param memberBWeight member B weight
   * @param totalWeight all members weight
   */
  function syncMembers(
    address memberA,
    uint256 memberAWeight,
    address memberB,
    uint256 memberBWeight,
    uint256 totalWeight
  )
    external
    onlyToken
    override
  {
    uint256 snapshotId = _getSnapshotIdAt(block.timestamp); // solhint-disable-line not-rely-on-time

    _setMemberWeight(
      memberA,
      memberAWeight,
      snapshotId
    );

    _setMemberWeight(
      memberB,
      memberBWeight,
      snapshotId
    );

    _setTotalWeight(
      totalWeight,
      snapshotId
    );
  }

  /**
   * @dev Removes token lp fees
   */
  function removeTokenLPFees()
    external
    onlyOperator
  {
    (
      MetaheroToken.Fees memory burnFees,
      MetaheroToken.Fees memory lpFees,
      MetaheroToken.Fees memory rewardsFees,
    ) = token.settings();

    require(
      lpFees.sender != 0 ||
      lpFees.recipient != 0,
      "MetaheroDAO#6" // already removed
    );

    token.updateFees(
      MetaheroToken.Fees(
        burnFees.sender.add(lpFees.sender),
        burnFees.recipient.add(lpFees.recipient)
      ),
      MetaheroToken.Fees(0, 0), // remove lp fees
      rewardsFees
    );
  }

  /**
   * @dev Excludes token account
   * @param account account address
   * @param excludeSenderFromFee exclude sender from fee
   * @param excludeRecipientFromFee exclude recipient from fee
   */
  function excludeTokenAccount(
    address account,
    bool excludeSenderFromFee,
    bool excludeRecipientFromFee
  )
    external
    onlyOperator
  {
    token.excludeAccount(
      account,
      excludeSenderFromFee,
      excludeRecipientFromFee
    );
  }

  /**
   * @dev Creates proposal
   * @param callData token call data
   * @param startsIn starts in
   * @param endsIn ends in
   * @param votesMinPercentage votes min percentage
   */
  function createProposal(
    bytes calldata callData,
    uint256 startsIn,
    uint256 endsIn,
    uint256 votesMinPercentage
  )
    external
    onlyOperator
  {
    require(
      endsIn > startsIn,
      "MetaheroDAO#7" // `ends in` should be higher than `starts in`
    );

    require(
      endsIn.sub(startsIn) >= settings.minVotingPeriod,
      "MetaheroDAO#8" // voting period is too short
    );

    proposalCounter++;

    uint256 proposalId = proposalCounter;
    uint256 snapshotId = _getSnapshotIdAt(block.timestamp); // solhint-disable-line not-rely-on-time
    uint256 startsAt = startsIn.add(block.timestamp); // solhint-disable-line not-rely-on-time
    uint256 endsAt = endsIn.add(block.timestamp); // solhint-disable-line not-rely-on-time
    uint256 votesMinWeight;

    if (votesMinPercentage != 0) {
      require(
        votesMinPercentage <= MAX_VOTES_MIN_PERCENTAGE,
        "MetaheroDAO#9" // invalid votes min percentage
      );

      votesMinWeight = _getTotalWeightOnSnapshot(
        snapshotId
      ).percent(votesMinPercentage);
    }

    proposals[proposalId].snapshotId = snapshotId;
    proposals[proposalId].callData = callData;
    proposals[proposalId].startsAt = startsAt;
    proposals[proposalId].endsAt = endsAt;
    proposals[proposalId].votesMinPercentage = votesMinPercentage;
    proposals[proposalId].votesMinWeight = votesMinWeight;

    emit ProposalCreated(
      proposalId,
      snapshotId,
      callData,
      startsAt,
      endsAt,
      votesMinPercentage,
      votesMinWeight
    );
  }

  /**
   * @dev Processes proposal
   * @param proposalId proposal id
   */
  function processProposal(
    uint256 proposalId
  )
    external
  {
    Proposal memory proposal = proposals[proposalId];

    require(
      proposal.snapshotId != 0,
      "MetaheroDAO#10" // proposal not found
    );

    require(
      proposal.endsAt <= block.timestamp, // solhint-disable-line not-rely-on-time
      "MetaheroDAO#11"
    );

    require(
      !proposal.processed,
      "MetaheroDAO#12" // already processed
    );

    if (
      proposal.callData.length > 0 &&
      proposal.votesYesWeight > proposal.votesNoWeight &&
      proposal.votesYesWeight >= proposal.votesMinWeight
    ) {
      (bool success, ) = address(token).call(proposal.callData); // solhint-disable-line avoid-low-level-calls

      require(
        success,
        "MetaheroDAO#13" // call failed
      );
    }

    proposals[proposalId].processed = true;

    emit ProposalProcessed(
      proposalId,
      proposal.votesYesWeight,
      proposal.votesNoWeight
    );
  }

  /**
   * @dev Submits vote
   * @param proposalId proposal id
   * @param vote where `1` eq yes and `2` eq no
   */
  function submitVote(
    uint256 proposalId,
    uint8 vote
  )
    external
  {
    Proposal memory proposal = proposals[proposalId];

    require(
      proposal.snapshotId != 0,
      "MetaheroDAO#14" // proposal not found
    );

    require(
      proposal.startsAt <= block.timestamp, // solhint-disable-line not-rely-on-time
      "MetaheroDAO#15"
    );

    require(
      proposal.endsAt > block.timestamp, // solhint-disable-line not-rely-on-time
      "MetaheroDAO#16"
    );

    require(
      vote == 1 ||
      vote == 2,
      "MetaheroDAO#17"
    );

    require(
      proposals[proposalId].votes[msg.sender] == 0,
      "MetaheroDAO#18"
    );

    uint256 memberWeight = _getMemberWeightOnSnapshot(
      msg.sender,
      proposal.snapshotId
    );

    require(
      memberWeight != 0,
      "MetaheroDAO#19"
    );

    if (vote == 1) { // yes vote
      proposals[proposalId].votesYesWeight = proposal.votesYesWeight.add(
        memberWeight
      );
    }

    if (vote == 2) { // no vote
      proposals[proposalId].votesNoWeight = proposal.votesNoWeight.add(
        memberWeight
      );
    }

    proposals[proposalId].votesCount = proposal.votesCount.add(1);
    proposals[proposalId].votes[msg.sender] = vote;

    emit VoteSubmitted(
      proposalId,
      msg.sender,
      vote
    );
  }

  // external functions (views)

  function getProposal(
    uint256 proposalId
  )
    external
    view
    returns (
      uint256 snapshotId,
      bytes memory callData,
      uint256 startsAt,
      uint256 endsAt,
      bool processed,
      uint256 votesMinPercentage,
      uint256 votesMinWeight,
      uint256 votesYesWeight,
      uint256 votesNoWeight,
      uint256 votesCount
    )
  {
    {
      snapshotId = proposals[proposalId].snapshotId;
      callData = proposals[proposalId].callData;
      startsAt = proposals[proposalId].startsAt;
      endsAt = proposals[proposalId].endsAt;
      processed = proposals[proposalId].processed;
      votesMinPercentage = proposals[proposalId].votesMinPercentage;
      votesMinWeight = proposals[proposalId].votesMinWeight;
      votesYesWeight = proposals[proposalId].votesYesWeight;
      votesNoWeight = proposals[proposalId].votesNoWeight;
      votesCount = proposals[proposalId].votesCount;
    }

    return (
      snapshotId,
      callData,
      startsAt,
      endsAt,
      processed,
      votesMinPercentage,
      votesMinWeight,
      votesYesWeight,
      votesNoWeight,
      votesCount
    );
  }

  function getMemberProposalVote(
    address member,
    uint256 proposalId
  )
    external
    view
    returns (uint8)
  {
    return proposals[proposalId].votes[member];
  }

  function getCurrentSnapshotId()
    external
    view
    returns (uint256)
  {
    return _getSnapshotIdAt(block.timestamp); // solhint-disable-line not-rely-on-time
  }

  function getSnapshotIdAt(
    uint256 timestamp
  )
    external
    view
    returns (uint256)
  {
    return _getSnapshotIdAt(timestamp);
  }

  function getCurrentMemberWeight(
    address member
  )
    external
    view
    returns (uint256)
  {
    return _getMemberWeightOnSnapshot(
      member,
      _getSnapshotIdAt(block.timestamp) // solhint-disable-line not-rely-on-time
    );
  }

  function getMemberWeightOnSnapshot(
    address member,
    uint256 snapshotId
  )
    external
    view
    returns (uint256)
  {
    return _getMemberWeightOnSnapshot(
      member,
      snapshotId
    );
  }

  function getCurrentTotalWeight()
    external
    view
    returns (uint256)
  {
    return _getTotalWeightOnSnapshot(
      _getSnapshotIdAt(block.timestamp) // solhint-disable-line not-rely-on-time
    );
  }

  function getTotalWeightOnSnapshot(
    uint256 snapshotId
  )
    external
    view
    returns (uint256)
  {
    return _getTotalWeightOnSnapshot(
      snapshotId
    );
  }

  // private functions

  function _setMemberWeight(
    address member,
    uint256 memberWeight,
    uint256 snapshotId
  )
    private
  {
    uint256 snapshotIdsLen = membersWeightsHistory[member].snapshotIds.length;

    if (snapshotIdsLen == 0) {
      membersWeightsHistory[member].weights.push(memberWeight);
      membersWeightsHistory[member].snapshotIds.push(snapshotId);
    } else {
      uint256 snapshotIdsLastIndex = snapshotIdsLen - 1;

      if (
        membersWeightsHistory[member].snapshotIds[snapshotIdsLastIndex] == snapshotId
      ) {
        membersWeightsHistory[member].weights[snapshotIdsLastIndex] = memberWeight;
      } else {
        membersWeightsHistory[member].weights.push(memberWeight);
        membersWeightsHistory[member].snapshotIds.push(snapshotId);
      }
    }
  }

  function _setTotalWeight(
    uint256 totalWeight,
    uint256 snapshotId
  )
    private
  {
    uint256 snapshotIdsLen = totalWeightsHistory.snapshotIds.length;

    if (snapshotIdsLen == 0) {
      totalWeightsHistory.weights.push(totalWeight);
      totalWeightsHistory.snapshotIds.push(snapshotId);
    } else {
      uint256 snapshotIdsLastIndex = snapshotIdsLen - 1;

      if (
        totalWeightsHistory.snapshotIds[snapshotIdsLastIndex] == snapshotId
      ) {
        totalWeightsHistory.weights[snapshotIdsLastIndex] = totalWeight;
      } else {
        totalWeightsHistory.weights.push(totalWeight);
        totalWeightsHistory.snapshotIds.push(snapshotId);
      }
    }
  }

  // private functions (views)

  function _getSnapshotIdAt(
    uint256 timestamp
  )
    private
    view
    returns (uint256)
  {
    return snapshotBaseTimestamp >= timestamp
      ? 0
      : timestamp.sub(
        snapshotBaseTimestamp
      ).div(
        settings.snapshotWindow
      ).add(1);
  }

  function _getMemberWeightOnSnapshot(
    address member,
    uint256 snapshotId
  )
    private
    view
    returns (uint256 result)
  {
    WeightsHistory memory weightsHistory = membersWeightsHistory[member];
    uint len = weightsHistory.snapshotIds.length;

    if (len != 0) {
      for (uint pos = 1 ; pos <= len ; pos++) {
        uint index = len - pos;

        if (weightsHistory.snapshotIds[index] <= snapshotId) {
          result = membersWeightsHistory[member].weights[index];
          break;
        }
      }
    } else {
      (
        ,
        uint256 holdingBalance,
        uint256 totalRewards
      ) = token.getBalanceSummary(member);

      if (totalRewards != 0) {
        result = holdingBalance;
      }
    }

    return result;
  }

  function _getTotalWeightOnSnapshot(
    uint256 snapshotId
  )
    private
    view
    returns (uint256 result)
  {
    uint len = totalWeightsHistory.snapshotIds.length;

    if (len != 0) {
      for (uint pos = 1 ; pos <= len ; pos++) {
        uint index = len - pos;

        if (totalWeightsHistory.snapshotIds[index] <= snapshotId) {
          result = totalWeightsHistory.weights[index];
          break;
        }
      }
    } else {
      (
        ,
        uint256 totalHolding,
        ,
      ) = token.summary();

      result = totalHolding;
    }

    return result;
  }
}
