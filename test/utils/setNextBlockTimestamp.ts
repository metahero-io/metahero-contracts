import { ethers } from 'hardhat';

const { provider } = ethers;

export async function setNextBlockTimestamp(timestamp: number): Promise<void> {
  await provider.send('evm_setNextBlockTimestamp', [timestamp]);
}
