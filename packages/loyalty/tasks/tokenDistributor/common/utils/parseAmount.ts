import { BigNumber, utils } from 'ethers';

export function parseAmount(value: string): BigNumber {
  let result: BigNumber;

  try {
    result = utils.parseEther(value);
  } catch (err) {
    result = null;
  }

  return result || BigNumber.from('0');
}
