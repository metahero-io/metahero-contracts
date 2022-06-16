import { ContractTransaction, BigNumber } from 'ethers';

export async function calcTxCost(tx: ContractTransaction): Promise<BigNumber> {
  const { gasPrice } = tx;
  const { gasUsed } = await tx.wait();

  return gasUsed.mul(gasPrice);
}
