import { ethers } from 'hardhat';
import { BigNumber } from 'ethers';

const { provider } = ethers;

export async function getBalance(
  account: string | { address: string },
): Promise<BigNumber> {
  let result: BigNumber = null;
  let address: string;

  if (account) {
    switch (typeof account) {
      case 'object':
        ({ address } = account);
        break;
      case 'string':
        address = account;
        break;
    }
  }

  if (address) {
    result = await provider.getBalance(address);
  }

  return result;
}
