import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-deploy';
import 'hardhat-deploy-ethers';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import { HardhatUserConfig } from 'hardhat/config';
import {
  createConfigNetworks,
  NETWORK_CONFIGS,
  NetworkNames,
} from './extensions';

const { HARDHAT_MNEMONIC, HARDHAT_FORKING_URL } = process.env;

const config: HardhatUserConfig = {
  namedAccounts: {
    from: 0,
  },
  networks: {
    hardhat: {
      forking: {
        url:
          HARDHAT_FORKING_URL ||
          NETWORK_CONFIGS[NetworkNames.Bsc].defaultProviderUrl,
      },
      accounts: {
        mnemonic:
          HARDHAT_MNEMONIC ||
          'test test test test test test test test test test test junk',
        count: 32,
      },
      chainId: 56,
      gasPrice: 20 * 1000000000,
    },
    ...createConfigNetworks(),
  },
  solidity: {
    version: '0.6.12',
    settings: {
      evmVersion: 'istanbul',
      metadata: {
        bytecodeHash: 'none',
      },
    },
  },
  paths: {
    sources: 'src',
    cache: '.hardhat/cache',
    artifacts: '.hardhat/artifacts',
    deploy: 'deploy',
    deployments: 'deployments',
  },
  buildPaths: {
    artifacts: 'artifacts',
  },
  typechain: {
    outDir: 'typings',
    target: 'ethers-v5',
    alwaysGenerateOverloads: false,
  },
  gasReporter: {
    enabled: false,
  },
};

module.exports = config;
