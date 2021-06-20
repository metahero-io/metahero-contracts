export enum ContractNames {
  BUSDToken = 'BUSDToken',
  HEROLPManager = 'HEROLPManager',
  HEROLPManagerUniswapV2 = 'HEROLPManagerUniswapV2',
  HEROPresale = 'HEROPresale',
  HEROToken = 'HEROToken',
  PancakeSwapRouter = 'PancakeSwapRouter',
}

export enum NetworkNames {
  Bsc = 'bsc',
  BscTest = 'bscTest',
}

export enum NetworkChainIds {
  Bsc = 56,
  BscTest = 97,
}

export const NETWORK_CONFIGS: {
  [key: string]: {
    title: string;
    chainId: number;
    defaultProviderUrl?: string;
    defaultGas?: number;
    defaultGasPrice?: number;
    explorer?: string;
  };
} = {
  [NetworkNames.Bsc]: {
    title: 'Binance Smart Chain',
    chainId: NetworkChainIds.Bsc,
    defaultProviderUrl: 'https://bsc-dataseed1.binance.org',
    defaultGasPrice: 20,
    explorer: 'https://bscscan.com',
  },
  [NetworkNames.BscTest]: {
    title: 'Binance Smart Chain (testnet)',
    chainId: NetworkChainIds.BscTest,
    defaultProviderUrl: 'https://data-seed-prebsc-1-s2.binance.org:8545',
    defaultGasPrice: 20,
    explorer: 'https://testnet.bscscan.com',
  },
};
