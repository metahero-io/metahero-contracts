// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

/**
 * @title Metahero DAO interface
 *
 * @author Stanisław Głogowski <stan@metahero.io>
 */
interface IMetaheroDAO {
  // external functions

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
    external;

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
    external;
}
