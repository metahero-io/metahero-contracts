import { NETWORK_CONFIGS, NetworkNames } from '../constants';
import { getNetworkEnvPrefix } from './getNetworkEnvPrefix';

export function getNetworkProviderUrl(networkName: NetworkNames): string {
  let result: string = null;

  if (NETWORK_CONFIGS[networkName]) {
    const { defaultProviderUrl } = NETWORK_CONFIGS[networkName];

    const envPrefix = getNetworkEnvPrefix(networkName);

    result = process.env[`${envPrefix}_PROVIDER_URL`] || defaultProviderUrl;
  }

  return result;
}
