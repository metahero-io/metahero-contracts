// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.12;

/**
 * @title Pancake UQ112x112 library
 *
 * @notice Based on https://github.com/pancakeswap/pancake-swap-core/blob/3b214306770e86bc3a64e67c2b5bdb566b4e94a7/contracts/libraries/UQ112x112.sol
 */
library PancakeUQ112x112 {
  uint224 internal constant Q112 = 2 ** 112;

  // internal functions (pure)

  function encode(
    uint112 y
  )
    internal
    pure
    returns (uint224)
  {
    return uint224(y) * Q112;
  }

  function uqdiv(
    uint224 x,
    uint112 y
  )
    internal
    pure
    returns (uint224)
  {
    return x / uint224(y);
  }
}
