import {
  DEPLOYMENTS_FILE_EXT,
  DEPLOYMENTS_DIR,
  PACKAGES_ROOT,
} from '../common';
import { join } from 'path';
import { readJSON } from 'fs-extra';

export async function getContractAddress(
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

export async function printFrontendEnvs(
  networkName: string,
  networkPath: string,
): Promise<void> {
  console.log();
  console.log(`## ${networkName}`);
  console.log();
  console.log(
    `REACT_APP_PAYMENT_TOKEN_ADDRESS=${await getContractAddress(
      'token',
      networkPath,
      'MetaheroToken',
    )}`,
  );
  console.log(
    `REACT_APP_SWAP_ROUTER_ADDRESS=${await getContractAddress(
      'token',
      networkPath,
      'SwapRouter',
    )}`,
  );
  console.log(
    `REACT_APP_BUSD_ADDRESS=${await getContractAddress(
      'token',
      networkPath,
      'SwapStableCoin',
    )}`,
  );
  console.log(
    `REACT_APP_WBNB_ADDRESS=${await getContractAddress(
      'token',
      networkPath,
      'SwapWrappedNative',
    )}`,
  );

  console.log();

  console.log(
    `REACT_APP_ERC20_HELPER_ADDRESS=${await getContractAddress(
      'helper',
      networkPath,
      'ERC20Helper',
    )}`,
  );

  console.log();

  console.log(
    `REACT_APP_LOYALTY_TOKEN_ADDRESS=${await getContractAddress(
      'loyalty',
      networkPath,
      'MetaheroLoyaltyToken',
    )}`,
  );
  console.log(
    `REACT_APP_LOYALTY_TOKEN_AUCTION_ADDRESS=${await getContractAddress(
      'loyalty',
      networkPath,
      'MetaheroLoyaltyTokenAuction',
    )}`,
  );
  console.log(
    `REACT_APP_LOYALTY_TOKEN_DISTRIBUTOR_ADDRESS=${await getContractAddress(
      'loyalty',
      networkPath,
      'MetaheroLoyaltyTokenDistributor',
    )}`,
  );
}
