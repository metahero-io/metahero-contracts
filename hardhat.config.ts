import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-deploy';
import 'hardhat-deploy-ethers';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import { HardhatUserConfig } from 'hardhat/config';
import {
  ContractNames,
  NetworkChainIds,
  NetworkNames,
  createConfigNetworks,
  getNetworkProviderUrl,
} from './extensions';

const { HARDHAT_MNEMONIC } = process.env;

const config: HardhatUserConfig = {
  namedAccounts: {
    from: 0,
  },
  networks: {
    hardhat: {
      forking: {
        url: getNetworkProviderUrl(NetworkNames.Bsc),
      },
      accounts: {
        mnemonic:
          HARDHAT_MNEMONIC ||
          'test test test test test test test test test test test junk',
        count: 32,
      },
      chainId: NetworkChainIds.Bsc,
      gasPrice: 20 * 1000000000,
      allowUnlimitedContractSize: true,
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
  etherscan: {
    apiKey: null,
  },
  knownContractsAddresses: {
    [NetworkChainIds.Bsc]: {
      [ContractNames.UniswapV2Router]:
        '0x05fF2B0DB69458A0750badebc4f9e13aDd608C7F',
      [ContractNames.StableCoin]: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    },
    [NetworkChainIds.BscTest]: {
      [ContractNames.UniswapV2Router]:
        '0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3',
      [ContractNames.StableCoin]: '0x78867BbEeF44f2326bF8DDd1941a4439382EF2A7',
    },
  },
  mocha: {
    timeout: 50000, // 50 sec
  },
};

module.exports = config;
