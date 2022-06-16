import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-deploy';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import { HardhatUserConfig } from 'hardhat/config';
import { DEFAULT_HARDHAT_NETWORKS_CONFIG } from '@metahero/common-contracts/hardhat';

const config: HardhatUserConfig = {
  networks: DEFAULT_HARDHAT_NETWORKS_CONFIG,
  solidity: {
    version: '0.6.12',
    settings: {
      evmVersion: 'istanbul',
      metadata: {
        bytecodeHash: 'none',
      },
    },
  },
  mocha: {
    timeout: 50000, // 50 sec
  },
};

module.exports = config;
