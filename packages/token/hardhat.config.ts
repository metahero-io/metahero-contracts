import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-deploy';
import 'hardhat-gas-reporter';
import 'solidity-coverage';
import { NetworkNames, buildConfig } from '@metahero/common-contracts/hardhat';

export default buildConfig({
  solidityVersion: '0.6.x',
  knownContracts: {
    [NetworkNames.Bnb]: {
      BUSDToken: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
      WBNBToken: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      SwapRouter: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    },
    [NetworkNames.BnbTest]: {
      BUSDToken: '0x78867BbEeF44f2326bF8DDd1941a4439382EF2A7',
      WBNBToken: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
      SwapRouter: '0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3',
    },
  },
});
