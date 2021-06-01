export enum NetworkNames {
  Bsc = 'bsc',
  BscTest = 'bscTest',
}

export const NETWORK_CONFIGS: {
  [key: string]: {
    chainId: number;
    defaultProviderUrl?: string;
    defaultGas?: number;
    defaultGasPrice?: number;
  };
} = {
  [NetworkNames.Bsc]: {
    chainId: 56,
    defaultProviderUrl: 'https://bsc-dataseed1.binance.org',
    defaultGasPrice: 20,
  },
  [NetworkNames.BscTest]: {
    chainId: 97,
    defaultProviderUrl: 'https://data-seed-prebsc-1-s2.binance.org:8545',
    defaultGasPrice: 20,
  },
};
