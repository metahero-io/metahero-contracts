import { join } from 'path';
import { extendConfig } from 'hardhat/config';
import { Envs } from '../shared';

extendConfig((config) => {
  const { root } = config.paths;

  config.paths = {
    ...config.paths,
    sources: join(root, 'src'),
    cache: join(root, '.hardhat/cache'),
    artifacts: join(root, '.hardhat/artifacts'),
  };

  const { getEnvAsBool } = Envs.processEnvs;

  (config as any).gasReporter = {
    enabled: getEnvAsBool('REPORT_GAS'),
    currency: 'USD',
  };
});
