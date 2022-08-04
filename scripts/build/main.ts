import { readdir, readFile, readJSON, writeFile } from 'fs-extra';
import { join } from 'path';
import {
  DEPLOYMENTS_CHAIN_ID_FILE,
  DEPLOYMENTS_FILE_EXT,
  DEPLOYMENTS_DIR,
  PACKAGES_ROOT,
  OUTPUT_ROOT,
  OUTPUT_CONSTANTS_JS_FILE_NAME,
  OUTPUT_CONSTANTS_TS_FILE_NAME,
  OUTPUT_CONTRACTS_JS_FILE_NAME,
} from './constants';
import { Contract } from './interfaces';
import templates from './templates';

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
            if (fileName.endsWith(DEPLOYMENTS_FILE_EXT)) {
              const { address, abi }: { address: string; abi: any } =
                await readJSON(join(networkPath, fileName));

              const name = fileName.replace(DEPLOYMENTS_FILE_EXT, '');

              if (contracts[name]) {
                contracts[name].addresses[chainId] = address;
              } else {
                contracts[name] = {
                  addresses: {
                    [chainId]: address,
                  },
                  abi,
                };
              }
            }
          }
        }
      }
    }
  }

  if (Object.keys(contracts)) {
    console.log(`Saving ${OUTPUT_CONSTANTS_JS_FILE_NAME} ... `);

    await writeFile(
      join(OUTPUT_ROOT, OUTPUT_CONSTANTS_JS_FILE_NAME),
      templates.constantsJS(chainIds, contracts),
    );

    console.log(`Saving ${OUTPUT_CONSTANTS_TS_FILE_NAME} ... `);

    await writeFile(
      join(OUTPUT_ROOT, OUTPUT_CONSTANTS_TS_FILE_NAME),
      templates.constantsTS(chainIds, contracts),
    );

    console.log(`Saving ${OUTPUT_CONTRACTS_JS_FILE_NAME} ... `);

    await writeFile(
      join(OUTPUT_ROOT, OUTPUT_CONTRACTS_JS_FILE_NAME),
      templates.contractsJS({ ...contracts }),
    );

    console.log();
    console.log('Completed!');
  }
}
