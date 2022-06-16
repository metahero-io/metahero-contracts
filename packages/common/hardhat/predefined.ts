import { NetworkNames } from './shared';

export const SUPPORTED_NETWORKS: Record<
  string,
  {
    chainId: number;
    url: string;
  }
> = {
  [NetworkNames.Local]: {
    chainId: 9999,
    url: 'http://localhost:9545',
  },
  [NetworkNames.Bsc]: {
    chainId: 56,
    url: 'http://localhost:8545',
  },
  [NetworkNames.BscTest]: {
    chainId: 97,
    url: 'https://kovan.infura.io/v3',
  },
};
