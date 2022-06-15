// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "./IMetaheroDAO.sol";

/**
 * @title Metahero DAO mock
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
contract MetaheroDAOMock is IMetaheroDAO {
  // events

  event MemberWeightSynced(address member, uint256 memberWeight);

  event TotalWeightSynced(uint256 totalWeight);

  // external functions

  function syncMember(
    address member,
    uint256 memberWeight,
    uint256 totalWeight
  ) external override {
    emit MemberWeightSynced(member, memberWeight);

    emit TotalWeightSynced(totalWeight);
  }

  function syncMembers(
    address memberA,
    uint256 memberAWeight,
    address memberB,
    uint256 memberBWeight,
    uint256 totalWeight
  ) external override {
    emit MemberWeightSynced(memberA, memberAWeight);

    emit MemberWeightSynced(memberB, memberBWeight);

    emit TotalWeightSynced(totalWeight);
  }
}
