import { HardhatUserConfig } from 'hardhat/config';
import { SUPPORTED_NETWORKS } from './predefined';
import {
  Envs,
  NetworkNames,
  ProcessEnvNames,
  HARDHAT_MNEMONIC,
} from './shared';

export const DEFAULT_HARDHAT_SOLIDITY_CONFIG: HardhatUserConfig['solidity'] = {
  version: '0.8.9',
  settings: {
    metadata: { bytecodeHash: 'none' },
    optimizer: { enabled: true, runs: 100 },
    outputSelection: {
      '*': {
        '*': [
          'abi',
          'evm.bytecode',
          'evm.deployedBytecode',
          'evm.methodIdentifiers',
          'metadata',
        ],
        '': ['ast'],
      },
    },
  },
};

export const DEFAULT_HARDHAT_NETWORKS_CONFIG: HardhatUserConfig['networks'] = {
  hardhat: {
    accounts: {
      mnemonic: HARDHAT_MNEMONIC,
      count: 32,
    },
    allowUnlimitedContractSize: true,
    chainId: SUPPORTED_NETWORKS[NetworkNames.Local].chainId,
    gasPrice: 10 * 1000000000,
    initialBaseFeePerGas: 0,
    saveDeployments: false,
  },

  ...Object.entries(SUPPORTED_NETWORKS)
    .map(([name, network]) => ({ name, ...network }))
    .reduce((result, { url, name, chainId }) => {
      const { useNamespace } = Envs.processEnvs;
      const { getEnvAsHex32, getEnvAsURL, getEnvAsBool, getEnvAsNumber } =
        useNamespace(name);

      const defaultGasPrice = getEnvAsNumber(
        ProcessEnvNames.DefaultGasPrice,
        undefined,
      );
      const privateKey = getEnvAsHex32(ProcessEnvNames.PrivateKey);

      return {
        ...result,
        [name]: {
          chainId,
          defaultGasPrice,
          url: getEnvAsURL(ProcessEnvNames.Url, url),
          accounts: privateKey ? [privateKey] : [],
          saveDeployments: getEnvAsBool(
            ProcessEnvNames.SaveLocalDeployments,
            true,
          ),
        },
      };
    }, {}),
};

export const DEFAULT_HARDHAT_CONFIG: HardhatUserConfig = {
  solidity: DEFAULT_HARDHAT_SOLIDITY_CONFIG,
  networks: DEFAULT_HARDHAT_NETWORKS_CONFIG,
};
