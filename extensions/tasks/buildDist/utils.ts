import { NETWORK_CONFIGS } from '../../constants';

export function getScanUrl(
  network: string,
  item: string,
  type: 'transaction' | 'address',
): string {
  let result: string = null;

  if (NETWORK_CONFIGS[network]) {
    const { explorer } = NETWORK_CONFIGS[network];

    if (explorer) {
      switch (type) {
        case 'address':
          result = `${explorer}/address/${item}`;
          break;
        case 'transaction':
          result = `${explorer}/tx/${item}`;
          break;
      }
    }
  }
  return result;
}
