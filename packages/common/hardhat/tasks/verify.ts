import { task, types } from 'hardhat/config';
import { HardhatPluginError } from 'hardhat/plugins';
import { NetworkNames } from '../shared';

const TASK_VERIFY = 'verify';

task(TASK_VERIFY, 'Verify all contracts')
  .addOptionalParam(
    'all',
    'Verifies all deployed contracts',
    false,
    types.boolean,
  )
  .setAction(async ({ all, ...args }: { all?: boolean }, hre, runSuper) => {
    const {
      network: { name: networkName },
      deployments,
      config,
      processNetworkEnvs: { buildEnvKey, getEnvValue },
    } = hre;

    if (!all) {
      return await runSuper(args);
    }

    const contracts = await deployments.all();
    const entries = Object.entries(contracts);

    switch (networkName) {
      case NetworkNames.Bsc:
      case NetworkNames.BscTest: {
        const apiKey = getEnvValue('etherscan.apiKey');

        if (!apiKey) {
          throw new HardhatPluginError(
            `Undefined ${buildEnvKey('etherscan.apiKey')} environment variable`,
          );
        }

        config.etherscan.apiKey = apiKey;

        for (const [name, { address }] of entries) {
          const superArgs: {
            contract?: string;
            address: string;
            constructorArgsParams: any[];
          } = {
            ...args,
            address,
            constructorArgsParams: [],
          };

          try {
            await runSuper(superArgs);
          } catch (err) {
            console.warn(
              `Contract ${name} verification error:`,
              err.toString(),
            );
          }
        }
        break;
      }
    }
  });
