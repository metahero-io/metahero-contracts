// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.12;

import '../uniswapV2/IUniswapV2Factory.sol';
import '../uniswapV2/IUniswapV2Pair.sol';
import './PancakePair.sol';


/**
 * @title Pancake factory
 *
 * @notice Based on https://github.com/pancakeswap/pancake-swap-core/blob/3b214306770e86bc3a64e67c2b5bdb566b4e94a7/contracts/PancakeFactory.sol
 */
contract PancakeFactory is IUniswapV2Factory {
  bytes32 public constant INIT_CODE_PAIR_HASH = keccak256(abi.encodePacked(type(PancakePair).creationCode));

  address public override feeTo;
  address public override feeToSetter;

  mapping(address => mapping(address => address)) public override getPair;
  address[] public override allPairs;

  constructor(
    address _feeToSetter
  )
    public
  {
    feeToSetter = _feeToSetter;
  }

  // external functions

  function createPair(
    address tokenA,
    address tokenB
  )
    external
    override
    returns (address pair)
  {
    require(tokenA != tokenB, 'Pancake: IDENTICAL_ADDRESSES');
    (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    require(token0 != address(0), 'Pancake: ZERO_ADDRESS');
    require(getPair[token0][token1] == address(0), 'Pancake: PAIR_EXISTS');
    // single check is sufficient
    bytes memory bytecode = type(PancakePair).creationCode;
    bytes32 salt = keccak256(abi.encodePacked(token0, token1));
    assembly {
      pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
    }
    IUniswapV2Pair(pair).initialize(token0, token1);
    getPair[token0][token1] = pair;
    getPair[token1][token0] = pair;
    // populate mapping in the reverse direction
    allPairs.push(pair);
    emit PairCreated(token0, token1, pair, allPairs.length);
  }

  function setFeeTo(
    address _feeTo
  )
    external
    override
  {
    require(msg.sender == feeToSetter, 'Pancake: FORBIDDEN');
    feeTo = _feeTo;
  }

  function setFeeToSetter(
    address _feeToSetter
  )
    external
    override
  {
    require(msg.sender == feeToSetter, 'Pancake: FORBIDDEN');
    feeToSetter = _feeToSetter;
  }

  // external functions (views)

  function allPairsLength()
    external
    override
    view
    returns (uint)
  {
    return allPairs.length;
  }
}
