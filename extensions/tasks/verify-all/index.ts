import { task } from 'hardhat/config';
import { HardhatPluginError } from 'hardhat/plugins';
import { NetworkNames } from '../../constants';
import { getNetworkEnvPrefix } from '../../utils';

const TASK_VERIFY = 'verify';
const TASK_VERIFY_ALL = 'verify-all';

task(TASK_VERIFY_ALL, 'Verify all contracts').setAction(async (args, hre) => {
  const {
    run,
    network: { name: networkName },
    deployments,
    config,
  } = hre;

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

      config.etherscan = {
        apiKey,
      };

      for (const [name, { address }] of entries) {
        const verifyArgs: {
          contract?: string;
          address: string;
          constructorArgsParams: any[];
        } = {
          address,
          constructorArgsParams: [],
        };

        try {
          await run(TASK_VERIFY, verifyArgs);
        } catch (err) {
          console.warn(`Contract ${name} verification error:`, err.toString());
        }
      }
      break;
    }
  }
});
