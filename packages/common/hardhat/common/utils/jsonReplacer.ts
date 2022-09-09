import { BigNumber } from 'ethers';

export function jsonReplacer(key: string, value: any): any {
  let result = value;

  if (value.type === 'BigNumber') {
    result = BigNumber.from(value).toString();
  }

  return result;
}
