import { extendEnvironment } from 'hardhat/config';
import { constants, BigNumber, ContractFactory, Contract } from 'ethers';
import { ContractNames } from './constants';
import { getNetworkEnvPrefix } from './utils';

extendEnvironment((hre) => {
  const {
    network: {
      name,
      config: { chainId },
    },
    config: { knownContractsAddresses },
  } = hre;

  hre.knownContracts = {
    getAddress(
      contractName: ContractNames,
      defaultValue = constants.AddressZero,
    ): string {
      let result = defaultValue;

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

  hre.helpers = {
    deployContract: async <T extends Contract = Contract>(
      contractName,
      ...contractArgs
    ) => {
      const { getContractFactory } = hre.ethers;

      const contractFactory: ContractFactory = (await getContractFactory(
        contractName,
      )) as any;

      const result = await contractFactory.deploy(...contractArgs);

      await result.deployed();

      return result as T;
    },

    getAccounts: async () => {
      const { getSigners } = hre.ethers;
      const signers = await getSigners();

      return signers.map(({ address }) => address);
    },
  };

  hre.getNetworkEnv = (envName, defaultValue) => {
    let result: any = defaultValue;

    const prefix = getNetworkEnvPrefix(name);

    const raw = process.env[`${prefix}_${envName}`];

    if (raw) {
      switch (typeof defaultValue) {
        case 'boolean':
          switch (raw.toUpperCase()) {
            case 'Y':
            case '1':
              result = true;
              break;

            case 'N':
            case '0':
              result = false;
              break;
          }
          break;

        case 'number':
          result = parseInt(raw, 10) || 0;
          break;

        case 'object':
          if (defaultValue instanceof BigNumber) {
            result = BigNumber.from(raw);
          }
          break;
      }
    }

    return result;
  };
});
