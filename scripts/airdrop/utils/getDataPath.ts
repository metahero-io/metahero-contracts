import { network } from 'hardhat';
import { resolve, join } from 'path';
import { NETWORK_CHAIN_ID_NAMES } from '../../../extensions';

const DATA_ROOT_PATH = resolve(__dirname, '../data');

export function getDataPath(fileName: string): string {
  const {
    config: { chainId },
  } = network;

  return join(DATA_ROOT_PATH, NETWORK_CHAIN_ID_NAMES[chainId], fileName);
}
