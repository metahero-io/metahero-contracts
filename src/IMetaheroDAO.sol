// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

/**
 * @title Metahero DAO interface
 *
 * @author Stanisław Głogowski <stan@metaMetahero.io>
 */
interface IMetaheroDAO {
  // external functions

  function syncMember(
    address member,
    uint256 memberWeight,
    uint256 totalWeight
  )
    external;

  function syncMembers(
    address memberA,
    uint256 memberAWeight,
    address memberB,
    uint256 memberBWeight,
    uint256 totalWeight
  )
    external;
}
