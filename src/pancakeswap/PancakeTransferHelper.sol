// SPDX-License-Identifier: GPL-3.0
/* solhint-disable */
pragma solidity ^0.6.12;

/**
 * @title Pancake transfer helper library
 *
 * @notice Based on https://github.com/pancakeswap/pancake-swap-lib/blob/0c16ece6edc575dc92076245badd62cddead47b3/contracts/utils/TransferHelper.sol
 */
library PancakeTransferHelper {
  // internal functions

  function safeApprove(
    address token,
    address to,
    uint256 value
  )
    internal
  {
    // bytes4(keccak256(bytes('approve(address,uint256)')));
    (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0x095ea7b3, to, value));
    require(success && (data.length == 0 || abi.decode(data, (bool))), 'TransferHelper: APPROVE_FAILED');
  }

  function safeTransfer(
    address token,
    address to,
    uint256 value
  )
    internal
  {
    // bytes4(keccak256(bytes('transfer(address,uint256)')));
    (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0xa9059cbb, to, value));
    require(success && (data.length == 0 || abi.decode(data, (bool))), 'TransferHelper: TRANSFER_FAILED');
  }

  function safeTransferFrom(
    address token,
    address from,
    address to,
    uint256 value
  )
    internal
  {
    // bytes4(keccak256(bytes('transferFrom(address,address,uint256)')));
    (bool success, bytes memory data) = token.call(abi.encodeWithSelector(0x23b872dd, from, to, value));
    require(success && (data.length == 0 || abi.decode(data, (bool))), 'TransferHelper: TRANSFER_FROM_FAILED');
  }

  function safeTransferBNB(
    address to,
    uint256 value
  )
    internal
  {
    (bool success,) = to.call{value : value}(new bytes(0));
    require(success, 'TransferHelper: BNB_TRANSFER_FAILED');
  }
}
