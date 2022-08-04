import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-deploy';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import { buildConfig } from '@metahero/common-contracts/hardhat';

export default buildConfig({
  externalDeployments: ['token'],
});
