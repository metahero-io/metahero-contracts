import { join } from 'path';
import { writeJson } from 'fs-extra';
import { task, types } from 'hardhat/config';

const TASK_DEPLOY = 'deploy';
const KNOWN_CONTRACTS_FILE_NAME = 'knownContracts.json';

task(TASK_DEPLOY, 'Deploys contracts')
  .addOptionalParam(
    'knownContractsOnly',
    'omit deployments and store only known contracts',
    false,
    types.boolean,
  )
  .setAction(
    async (
      { knownContractsOnly, ...args }: { knownContractsOnly: boolean },
      hre,
      runSuper,
    ) => {
      const {
        network: { name: networkName },
        config: {
          paths: { deployments: deploymentsPath },
        },
        knownContracts,
      } = hre;

      if (!knownContractsOnly) {
        await runSuper(args);
      }

      const knownContractsFilePath = join(
        deploymentsPath,
        networkName,
        KNOWN_CONTRACTS_FILE_NAME,
      );

      await writeJson(knownContractsFilePath, knownContracts, {
        encoding: 'utf8',
        spaces: 2,
      });
    },
  );
