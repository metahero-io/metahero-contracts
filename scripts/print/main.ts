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

function logFrontendEnv(key: string, value: string): void {
  if (value) {
    console.log(`REACT_APP_${key}=${value}`);
  }
}

function logBackendEnv(key: string, value: string): void {
  if (value) {
    console.log(`CONTRACTS_${key}=${value}`);
  }
}

async function printFrontendEnvs(networkPath: string): Promise<void> {
  logFrontendEnv(
    'PAYMENT_TOKEN_ADDRESS',
    await getContractAddress('token', networkPath, 'MetaheroToken'),
  );

  logFrontendEnv(
    'BUSD_TOKEN_ADDRESS',
    await getContractAddress('token', networkPath, 'BUSDToken'),
  );

  logFrontendEnv(
    'WBNB_TOKEN_ADDRESS',
    await getContractAddress('token', networkPath, 'WBNBToken'),
  );

  logFrontendEnv(
    'ERC20_HELPER_ADDRESS',
    await getContractAddress('helper', networkPath, 'ERC20Helper'),
  );

  logFrontendEnv(
    'SWAP_ROUTER_ADDRESS',
    await getContractAddress('token', networkPath, 'SwapRouter'),
  );
}

async function printBackendEnvs(networkPath: string): Promise<void> {
  logBackendEnv(
    'PAYMENT_TOKEN_ADDRESS',
    await getContractAddress('token', networkPath, 'MetaheroToken'),
  );

  logBackendEnv(
    'BUSD_TOKEN_ADDRESS',
    await getContractAddress('token', networkPath, 'BUSDToken'),
  );

  logBackendEnv(
    'WBNB_TOKEN_ADDRESS',
    await getContractAddress('token', networkPath, 'WBNBToken'),
  );

  logBackendEnv(
    'SWAP_ROUTER_ADDRESS',
    await getContractAddress('token', networkPath, 'SwapRouter'),
  );
}

export async function main(path: string): Promise<void> {
  console.log();
  console.log('# Frontend');
  console.log();

  await printFrontendEnvs(path || 'local');

  console.log();
  console.log('# Backend');
  console.log();

  await printBackendEnvs(path || 'local');

  console.log();
}
