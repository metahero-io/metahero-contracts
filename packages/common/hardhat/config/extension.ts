import { join } from 'path';
import { extendConfig, HardhatUserConfig } from 'hardhat/config';
import { Envs } from '../common';

extendConfig((config, userConfig) => {
  const { knownContracts } = userConfig;
  const { root } = config.paths;

  config.paths = {
    ...config.paths,
    sources: join(root, 'src'),
    cache: join(root, '.hardhat/cache'),
    artifacts: join(root, '.hardhat/artifacts'),
  };

  const { getEnvAsBool } = Envs.processEnvs;

  config.knownContracts = knownContracts || {};

  (config as any as HardhatUserConfig).gasReporter = {
    enabled: getEnvAsBool('REPORT_GAS'),
    currency: 'USD',
  };
});
