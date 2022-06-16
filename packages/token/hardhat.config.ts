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
  // knownContractsAddresses: {
  //   [NetworkChainIds.Bsc]: {
  //     [ContractNames.UniswapV2Router]:
  //       '0x10ed43c718714eb63d5aa57b78b54704e256024e',
  //     [ContractNames.StableCoin]: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
  //   },
  //   [NetworkChainIds.BscTest]: {
  //     [ContractNames.UniswapV2Router]:
  //       '0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3',
  //     [ContractNames.StableCoin]: '0x78867BbEeF44f2326bF8DDd1941a4439382EF2A7',
  //   },
  // },
  mocha: {
    timeout: 50000, // 50 sec
  },
};

module.exports = config;
