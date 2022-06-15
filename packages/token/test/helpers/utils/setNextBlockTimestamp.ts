import { ethers } from 'hardhat';

const { provider } = ethers;

export async function setNextBlockTimestamp(
  timestamp?: number,
): Promise<number> {
  if (!timestamp) {
    ({ timestamp } = await provider.getBlock('latest'));

    timestamp += 1;
  }

  await provider.send(
    'evm_setNextBlockTimestamp', //
    [
      timestamp, //
    ],
  );

  return timestamp;
}
