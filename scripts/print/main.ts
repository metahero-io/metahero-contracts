import { join } from 'path';
import { readJSON } from 'fs-extra';
import {
  DEPLOYMENTS_FILE_EXT,
  DEPLOYMENTS_DIR,
  PACKAGES_ROOT,
} from '../common';
import { NETWORK } from './constants';

async function getContractAddress(
  packageName: string,
  networkPath: string,
  contractName: string,
): Promise<string> {
  let result: string;

  if (packageName) {
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

  return result || '';
}

function logFrontendEnv(key: string, value: string): void {
  if (value) {
    console.log(`REACT_APP_${key}=${value}`);
  }
}

async function printFrontendEnvs(networkPath: string): Promise<void> {
  logFrontendEnv(
    'PAYMENT_TOKEN_ADDRESS',
    await getContractAddress('token', networkPath, 'MetaheroToken'),
  );

  logFrontendEnv(
    'SWAP_ROUTER_ADDRESS',
    await getContractAddress('token', networkPath, 'SwapRouter'),
  );

  logFrontendEnv(
    'BUSD_ADDRESS',
    await getContractAddress('token', networkPath, 'SwapStableCoin'),
  );

  logFrontendEnv(
    'WBNB_ADDRESS',
    await getContractAddress('token', networkPath, 'SwapWrappedNative'),
  );

  logFrontendEnv(
    'ERC20_HELPER_ADDRESS',
    await getContractAddress('helper', networkPath, 'ERC20Helper'),
  );

  logFrontendEnv(
    'LOYALTY_TOKEN_ADDRESS',
    await getContractAddress('loyalty', networkPath, 'MetaheroLoyaltyToken'),
  );

  logFrontendEnv(
    'LOYALTY_TOKEN_AUCTION_ADDRESS',
    await getContractAddress(
      'loyalty',
      networkPath,
      'MetaheroLoyaltyTokenAuction',
    ),
  );

  logFrontendEnv(
    'LOYALTY_TOKEN_DISTRIBUTOR_ADDRESS',
    await getContractAddress(
      'loyalty',
      networkPath,
      'MetaheroLoyaltyTokenDistributor',
    ),
  );
}

export async function main(): Promise<void> {
  for (const { name, path } of NETWORK) {
    console.log();
    console.log(`# ${name}`);
    console.log();
    console.log('## Frontend');
    console.log();

    await printFrontendEnvs(path);

    console.log();
  }
}
