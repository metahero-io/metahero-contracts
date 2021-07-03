import { ContractTransaction, ContractReceipt, BigNumber } from 'ethers';

export async function logTx(
  label: string,
  txP: Promise<ContractTransaction>,
  ...args: any[]
): Promise<{
  tx: ContractTransaction;
  receipt: ContractReceipt;
  totalCost: BigNumber;
}> {
  console.log(label, ...args);

  const tx = await txP;

  const { hash, gasPrice } = tx;

  console.log('> tx hash:', hash);

  const receipt = await tx.wait();
  const { gasUsed } = receipt;

  console.log('> gas used:', gasUsed.toString());

  return {
    tx,
    receipt,
    totalCost: gasPrice.mul(gasUsed),
  };
}
