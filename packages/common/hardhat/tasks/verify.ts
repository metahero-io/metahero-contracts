import { task, types } from 'hardhat/config';
import { HardhatPluginError } from 'hardhat/plugins';
import { NetworkNames } from '../common';

const TASK_VERIFY = 'verify';

task(TASK_VERIFY, 'Verifies contracts')
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
      case NetworkNames.Bnb:
      case NetworkNames.BnbTest: {
        const envKey = 'etherscan.apiKey';
        const apiKey = getEnvValue(envKey);

        if (!apiKey) {
          throw new HardhatPluginError(
            `Undefined ${buildEnvKey(envKey)} environment variable`,
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
