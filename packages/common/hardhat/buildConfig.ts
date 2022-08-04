import { HardhatUserConfig } from 'hardhat/config';
import {
  DEFAULT_HARDHAT_SOLIDITY_CONFIG_0_8,
  DEFAULT_HARDHAT_SOLIDITY_CONFIG_0_6,
  DEFAULT_HARDHAT_NETWORKS_CONFIG,
} from './defaults';
import { NetworkNames } from './shared';

export function buildConfig(
  options: {
    solidityVersion?: '0.8.x' | '0.6.x';
    externalDeployments?: string[];
  } = {},
): HardhatUserConfig {
  const { solidityVersion, externalDeployments } = {
    solidityVersion: '0.8.x',
    externalDeployments: [],
    ...options,
  };

  let solidity: HardhatUserConfig['solidity'];

  switch (solidityVersion) {
    case '0.8.x':
      solidity = DEFAULT_HARDHAT_SOLIDITY_CONFIG_0_8;
      break;

    case '0.6.x':
      solidity = DEFAULT_HARDHAT_SOLIDITY_CONFIG_0_6;
      break;
  }

  let external: HardhatUserConfig['external'];

  if (externalDeployments.length) {
    external = {
      deployments: Object.values(NetworkNames).reduce(
        (result, name) => ({
          ...result,
          [name]: externalDeployments.map(
            (packageName) => `../${packageName}/deployments/${name}`,
          ),
        }),
        {},
      ),
    };
  }

  return {
    solidity,
    networks: DEFAULT_HARDHAT_NETWORKS_CONFIG,
    external,
    mocha: {
      timeout: 50000,
    },
  };
}
