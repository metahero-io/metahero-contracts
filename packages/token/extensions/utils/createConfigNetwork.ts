import { HardhatUserConfig } from 'hardhat/config';
import { NETWORK_CONFIGS, NetworkNames } from '../constants';
import { getNetworkEnvPrefix } from './getNetworkEnvPrefix';
import { getNetworkProviderUrl } from './getNetworkProviderUrl';

export function createConfigNetwork(
  networkName: NetworkNames,
): HardhatUserConfig['networks'] {
  let result: HardhatUserConfig['networks'] = null;

  if (NETWORK_CONFIGS[networkName]) {
    const { chainId, defaultGas, defaultGasPrice } =
      NETWORK_CONFIGS[networkName];

    const url = getNetworkProviderUrl(networkName);
    const envPrefix = getNetworkEnvPrefix(networkName);

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
