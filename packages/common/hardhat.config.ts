import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-deploy';
import 'hardhat-gas-reporter';
import 'solidity-coverage';

export {
  DEFAULT_HARDHAT_NETWORKS_CONFIG,
  DEFAULT_HARDHAT_SOLIDITY_CONFIG,
  DEFAULT_HARDHAT_CONFIG as default,
} from './hardhat';
