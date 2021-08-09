// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./core/lifecycle/Initializable.sol";
import "./core/math/SafeMathLib.sol";
import "./IMetaheroDAO.sol";


/**
 * @title Metahero DAO
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
contract MetaheroDAO is Initializable, IMetaheroDAO {
  using SafeMathLib for uint256;

  struct Settings {
    uint256 snapshotLength;
  }

  struct Proposal {
    bytes data;
    uint256 fromSnapshotId;
    uint256 toSnapshotId;
  }

  struct WeightsHistory {
    uint256[] values;
    uint256[] snapshotIds;
  }

  /**
   * @return operator address
   */
  address public operator;

  /**
   * @return token address
   */
  address public token;

  /**
   * @return settings object
   */
  Settings public settings;

  mapping(address => WeightsHistory) private membersWeightsHistory;
  WeightsHistory private totalWeightsHistory;
  uint256 private snapshotBaseTimestamp;

  // events

  /**
   * @dev Emitted the contract is initialized
   * @param operator operator address
   * @param token token address
   * @param snapshotLength snapshot length
   */
  event Initialized(
    address operator,
    address token,
    uint256 snapshotLength
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
      msg.sender == token,
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
   * @param operator_ operator address
   * @param token_ token address
   * @param snapshotLength snapshot length
   */
  function initialize(
    address operator_,
    address token_,
    uint256 snapshotLength
  )
    external
    onlyInitializer
  {
    require(
      operator_ != address(0),
      "MetaheroDAO#3"
    );

    require(
      token_ != address(0),
      "MetaheroDAO#4"
    );

    require(
      snapshotLength != 0,
      "MetaheroDAO#5"
    );

    operator = operator_;

    settings.snapshotLength = snapshotLength;

    snapshotBaseTimestamp = block.timestamp;

    emit Initialized(
      operator_,
      token_,
      snapshotLength
    );
  }

  function syncMember(
    address member,
    uint256 memberWeight,
    uint256 totalWeight
  )
    external
    onlyToken
    override
  {
    uint256 currentSnapshotId = _getSnapshotIdAt(block.timestamp);

    _setMemberWeight(
      member,
      memberWeight,
      currentSnapshotId
    );

    _setTotalWeight(
      totalWeight,
      currentSnapshotId
    );
  }

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
    uint256 currentSnapshotId = _getSnapshotIdAt(block.timestamp);

    _setMemberWeight(
      memberA,
      memberAWeight,
      currentSnapshotId
    );

    _setMemberWeight(
      memberB,
      memberBWeight,
      currentSnapshotId
    );

    _setTotalWeight(
      totalWeight,
      currentSnapshotId
    );
  }

  // external functions

  function getCurrentSnapshotId()
    external
    view
    returns (uint256)
  {
    return _getSnapshotIdAt(block.timestamp);
  }

  function getSnapshotIdAt(
    uint256 timestamp
  )
    external
    view
    returns (uint256)
  {
    return _getSnapshotIdAt(timestamp >= snapshotBaseTimestamp
      ? timestamp
      : snapshotBaseTimestamp
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
      membersWeightsHistory[member].values.push(memberWeight);
      membersWeightsHistory[member].snapshotIds.push(snapshotId);
    } else {
      uint256 snapshotIdsLastIndex = snapshotIdsLen - 1;

      if (
        membersWeightsHistory[member].snapshotIds[snapshotIdsLastIndex] == snapshotId
      ) {
        membersWeightsHistory[member].values[snapshotIdsLastIndex] = memberWeight;
      } else {
        membersWeightsHistory[member].values.push(memberWeight);
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
      totalWeightsHistory.values.push(memberWeight);
      totalWeightsHistory.snapshotIds.push(snapshotId);
    } else {
      uint256 snapshotIdsLastIndex = snapshotIdsLen - 1;

      if (
        totalWeightsHistory.snapshotIds[snapshotIdsLastIndex] == snapshotId
      ) {
        totalWeightsHistory.values[snapshotIdsLastIndex] = memberWeight;
      } else {
        totalWeightsHistory.values.push(memberWeight);
        totalWeightsHistory.snapshotIds.push(snapshotId);
      }
    }
  }

  // private functions (views)

  function _getCurrentSnapshotId()
    private
    view
    returns (uint256)
  {
    return _getSnapshotIdAt(block.timestamp);
  }

  function _getSnapshotIdAt(
    uint256 timestamp
  )
    private
    view
    returns (uint256)
  {
    return timestamp.sub(
      snapshotBaseTimestamp
    ).div(
      settings.snapshotLength
    );
  }
}
