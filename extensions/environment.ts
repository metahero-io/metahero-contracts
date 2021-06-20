import { extendEnvironment } from 'hardhat/config';
import { constants, BigNumber } from 'ethers';
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
