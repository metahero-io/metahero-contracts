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
    url: 'http://localhost:8545',
  },
  [NetworkNames.Bsc]: {
    chainId: 56,
    url: 'https://bsc-dataseed1.binance.org',
  },
  [NetworkNames.BscTest]: {
    chainId: 97,
    url: 'https://data-seed-prebsc-1-s2.binance.org:8545',
  },
};
