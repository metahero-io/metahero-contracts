import { HardhatUserConfig } from 'hardhat/config';
import { NetworkNames, NETWORK_CONFIGS } from '../constants';

export function createConfigNetwork(
  networkName: NetworkNames,
): HardhatUserConfig['networks'] {
  let result: HardhatUserConfig['networks'] = null;

  if (NETWORK_CONFIGS[networkName]) {
    const { chainId, defaultGas, defaultGasPrice, defaultProviderUrl } =
      NETWORK_CONFIGS[networkName];

    const envPrefix = networkName.replace(/([A-Z])+/, '_$1').toUpperCase();

    const url =
      process.env[`${envPrefix}_PROVIDER_ENDPOINT`] || defaultProviderUrl;

    if (url) {
      let gas = parseInt(process.env[`${envPrefix}_PROVIDER_GAS`], 10);

      if (!gas && defaultGas) {
        gas = defaultGas;
      }

      let gasPrice =
        parseInt(process.env[`${envPrefix}_PROVIDER_GAS_PRICE`], 10) ||
        undefined;

      if (!gasPrice && defaultGasPrice) {
        gasPrice = defaultGasPrice;
      }

      if (gasPrice) {
        gasPrice *= 1000000000;
      }

      const privateKey = process.env[`${envPrefix}_PROVIDER_PRIVATE_KEY`];
      const accounts = privateKey ? [privateKey] : [];

      result = {
        [networkName]: {
          chainId,
          url,
          accounts,
          gas,
          gasPrice,
        },
      };
    }
  }

  return result;
}
