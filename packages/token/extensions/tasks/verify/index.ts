import { task, types } from 'hardhat/config';
import { HardhatPluginError } from 'hardhat/plugins';
import { NetworkNames } from '../../constants';
import { getNetworkEnvPrefix } from '../../utils';

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
    } = hre;

    if (!all) {
      return await runSuper(args);
    }

    const contracts = await deployments.all();
    const entries = Object.entries(contracts);

    switch (networkName) {
      case NetworkNames.Bsc:
      case NetworkNames.BscTest: {
        const envPrefix = getNetworkEnvPrefix(networkName);
        const envName = `${envPrefix}_API_KEY`;
        const apiKey = process.env[envName];

        if (!apiKey) {
          throw new HardhatPluginError(
            `Undefined ${envName} environment variable`,
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
