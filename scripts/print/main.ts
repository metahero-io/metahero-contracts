import { join } from 'path';
import { readJSON } from 'fs-extra';
import {
  DEPLOYMENTS_FILE_EXT,
  DEPLOYMENTS_DIR,
  DEPLOYMENTS_KNOWN_CONTRACTS_FILE,
  PACKAGES_ROOT,
} from '../common';

const knownContractsMap = new Map<string, Record<string, string>>();

async function getContractAddress(
  packageName: string,
  networkPath: string,
  contractName: string,
): Promise<string> {
  let result: string;

  if (packageName) {
    const knownContractsKey = `${packageName}:${networkPath}`;
    if (!knownContractsMap.has(knownContractsKey)) {
      let knownContracts: Record<string, string>;

      try {
        const filePath = join(
          PACKAGES_ROOT,
          packageName,
          DEPLOYMENTS_DIR,
          networkPath,
          DEPLOYMENTS_KNOWN_CONTRACTS_FILE,
        );
        knownContracts = (await readJSON(filePath)) || {};
      } catch (err) {
        knownContracts = {};
      }

      knownContractsMap.set(knownContractsKey, knownContracts);
    }

    result = knownContractsMap.get(knownContractsKey)[contractName];

    if (!result) {
      try {
        const filePath = join(
          PACKAGES_ROOT,
          packageName,
          DEPLOYMENTS_DIR,
          networkPath,
          `${contractName}${DEPLOYMENTS_FILE_EXT}`,
        );

        const { address }: { address: string } = await readJSON(filePath);

        result = address;
      } catch (err) {
        //
      }
    }
  }

  return result || '';
}

function logReactAppEnv(key: string, value: string): void {
  if (value) {
    console.log(`REACT_APP_${key}=${value}`);
  }
}

async function printFrontendEnvs(networkPath: string): Promise<void> {
  logReactAppEnv(
    'PAYMENT_TOKEN_ADDRESS',
    await getContractAddress('token', networkPath, 'MetaheroToken'),
  );

  logReactAppEnv(
    'SWAP_ROUTER_ADDRESS',
    await getContractAddress('token', networkPath, 'SwapRouter'),
  );

  logReactAppEnv(
    'BUSD_ADDRESS',
    await getContractAddress('token', networkPath, 'BUSDToken'),
  );

  logReactAppEnv(
    'WBNB_ADDRESS',
    await getContractAddress('token', networkPath, 'WBNBToken'),
  );

  logReactAppEnv(
    'ERC20_HELPER_ADDRESS',
    await getContractAddress('helper', networkPath, 'ERC20Helper'),
  );
}

export async function main(path: string): Promise<void> {
  console.log();
  console.log('# Metahero APP');
  console.log();

  await printFrontendEnvs(path || 'local');

  console.log();
}
