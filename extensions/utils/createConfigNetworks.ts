import { HardhatUserConfig } from 'hardhat/config';
import { NetworkNames } from '../constants';
import { createConfigNetwork } from './createConfigNetwork';

export function createConfigNetworks(): HardhatUserConfig['networks'] {
  return Object.values(NetworkNames).reduce(
    (result, networkName) => ({
      ...result,
      ...createConfigNetwork(networkName),
    }),
    {},
  );
}
