import { NETWORK_CONFIGS } from '../constants';

export function getNetworkTitle(network: string): string {
  let result: string = null;

  if (NETWORK_CONFIGS[network]) {
    ({ title: result } = NETWORK_CONFIGS[network]);
  }

  return result;
}
