import { extendEnvironment } from 'hardhat/config';
import { constants } from 'ethers';
import { ContractNames } from './constants';

extendEnvironment((hre) => {
  const {
    network: {
      config: { chainId },
    },
    config: { knownContractsAddresses },
  } = hre;

  hre.knownContracts = {
    getAddress(contractName: ContractNames): string {
      let result = constants.AddressZero;

      if (
        knownContractsAddresses &&
        knownContractsAddresses[chainId] &&
        knownContractsAddresses[chainId][contractName]
      ) {
        result = knownContractsAddresses[chainId][contractName];
      }

      return result;
    },
  };
});
