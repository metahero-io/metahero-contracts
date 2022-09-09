import { readdir, readFile, readJSON, writeFile } from 'fs-extra';
import { join } from 'path';
import {
  DEPLOYMENTS_CHAIN_ID_FILE,
  DEPLOYMENTS_DIR,
  DEPLOYMENTS_FILE_EXT,
  DEPLOYMENTS_KNOWN_CONTRACTS_FILE,
  PACKAGES_ROOT,
} from '../common';
import {
  DIST_PATH,
  DIST_CONSTANTS_JS_FILE_NAME,
  DIST_CONSTANTS_TS_FILE_NAME,
  DIST_CONTRACTS_JS_FILE_NAME,
} from './constants';
import { Contract } from './interfaces';
import * as templates from './templates';

export async function main(): Promise<void> {
  const chainIds: Record<string, number> = {};
  const contracts: Record<string, Contract> = {};

  const packageNames = await readdir(PACKAGES_ROOT);

  for (const packageName of packageNames) {
    const packageRoot = join(PACKAGES_ROOT, packageName, DEPLOYMENTS_DIR);

    let networkNames: string[];

    try {
      networkNames = await readdir(packageRoot);
    } catch (err) {
      //
    }

    if (networkNames) {
      for (let networkName of networkNames) {
        const networkPath = join(packageRoot, networkName);

        if (networkName === 'local') {
          continue;
        }

        let fileNames: string[];

        try {
          fileNames = await readdir(networkPath);
        } catch (err) {
          //
        }

        if (fileNames) {
          let chainId: number;

          networkName = `-${networkName}`.replace(
            /-([a-z])/gi,
            (_, found: string) => found.toUpperCase(),
          );

          try {
            if (chainIds[networkName]) {
              chainId = chainIds[networkName];
            } else {
              chainId = parseInt(
                await readFile(
                  join(networkPath, DEPLOYMENTS_CHAIN_ID_FILE),
                  'utf-8',
                ),
                10,
              );

              if (chainId) {
                chainIds[networkName] = chainId;
              }
            }
          } catch (err) {
            //
          }

          if (!chainId) {
            continue;
          }

          for (const fileName of fileNames) {
            const filePath = join(networkPath, fileName);

            let contractsMap: Record<string, string> = null;

            if (fileName === DEPLOYMENTS_KNOWN_CONTRACTS_FILE) {
              contractsMap = await readJSON(filePath);
            } else if (fileName.endsWith(DEPLOYMENTS_FILE_EXT)) {
              const { address }: { address: string } = await readJSON(filePath);

              const name = fileName.replace(DEPLOYMENTS_FILE_EXT, '');

              if (address && name) {
                contractsMap = {
                  [name]: address,
                };
              }
            }

            if (contractsMap) {
              const entries = Object.entries(contractsMap);

              for (const [name, address] of entries) {
                if (contracts[name]) {
                  contracts[name].addresses[chainId] = address;
                } else {
                  contracts[name] = {
                    addresses: {
                      [chainId]: address,
                    },
                  };
                }
              }
            }
          }
        }
      }
    }
  }

  if (Object.keys(contracts)) {
    console.log(`Saving ${DIST_CONSTANTS_JS_FILE_NAME} ... `);

    await writeFile(
      join(DIST_PATH, DIST_CONSTANTS_JS_FILE_NAME),
      templates.constantsJS(chainIds, contracts),
    );

    console.log(`Saving ${DIST_CONSTANTS_TS_FILE_NAME} ... `);

    await writeFile(
      join(DIST_PATH, DIST_CONSTANTS_TS_FILE_NAME),
      templates.constantsTS(chainIds, contracts),
    );

    console.log(`Saving ${DIST_CONTRACTS_JS_FILE_NAME} ... `);

    await writeFile(
      join(DIST_PATH, DIST_CONTRACTS_JS_FILE_NAME),
      templates.contractsJS({ ...contracts }),
    );

    console.log();
    console.log('Completed!');
  }
}
