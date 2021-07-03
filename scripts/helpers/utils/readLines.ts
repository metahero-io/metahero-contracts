import { resolve } from 'path';
import { network } from 'hardhat';
import { readFile } from 'fs-extra';
import { NETWORK_CHAIN_ID_NAMES } from '../../../extensions';

const {
  config: { chainId },
} = network;

const name = NETWORK_CHAIN_ID_NAMES[chainId];

export async function readLines<T = string>(
  fileName: string,
  lineParser: (line: string) => T,
): Promise<T[]> {
  const filePath = resolve(__dirname, '..', '..', 'data', name, fileName);

  console.log('Reading file:');
  console.log(filePath);

  let result: T[];

  try {
    const content = await readFile(filePath, { encoding: 'utf8' });
    result = content
      .split('\n')
      .map((line) => lineParser(line))
      .filter((value) => !!value);
  } catch (err) {
    result = [];
  }

  if (!result.length) {
    throw new Error('Invalid file!');
  }

  return result;
}
