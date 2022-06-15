/* eslint-disable no-unused-vars */

export enum ContractNames {
  MetaheroAirdrop = 'MetaheroAirdrop',
  MetaheroDAO = 'MetaheroDAO',
  MetaheroLPM = 'MetaheroLPM',
  MetaheroLPMForUniswapV2 = 'MetaheroLPMForUniswapV2',
  MetaheroSwapHelper = 'MetaheroSwapHelper',
  MetaheroToken = 'MetaheroToken',
  StableCoin = 'StableCoin',
  UniswapV2Router = 'UniswapV2Router',
}

export enum NetworkNames {
  Bsc = 'bsc',
  BscTest = 'bsc-test',
  Local = 'local',
}

export enum NetworkChainIds {
  Bsc = 56,
  BscTest = 97,
  Local = 9999,
}

/* eslint-enable no-unused-vars */

export const NETWORK_CHAIN_ID_NAMES: { [key: number]: string } = {
  [NetworkChainIds.Bsc]: NetworkNames.Bsc,
  [NetworkChainIds.BscTest]: NetworkNames.BscTest,
  [NetworkChainIds.Local]: NetworkNames.Local,
};

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
    defaultGasPrice: 10,
    explorer: 'https://bscscan.com',
  },
  [NetworkNames.BscTest]: {
    title: 'Binance Smart Chain (testnet)',
    chainId: NetworkChainIds.BscTest,
    defaultProviderUrl: 'https://data-seed-prebsc-1-s2.binance.org:8545',
    defaultGasPrice: 10,
    explorer: 'https://testnet.bscscan.com',
  },
};
