import { ethers } from 'hardhat';

const { provider } = ethers;

export async function increaseTime(seconds: number): Promise<void> {
  await provider.send('evm_increaseTime', [seconds]);
}
