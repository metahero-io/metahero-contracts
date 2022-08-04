import { HardhatUserConfig } from 'hardhat/config';
import { SUPPORTED_NETWORKS } from './predefined';
import { Envs, ProcessEnvNames, HARDHAT_MNEMONIC } from './shared';

export const DEFAULT_HARDHAT_SOLIDITY_CONFIG_0_8: HardhatUserConfig['solidity'] =
  {
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

export const DEFAULT_HARDHAT_SOLIDITY_CONFIG_0_6: HardhatUserConfig['solidity'] =
  {
    version: '0.6.12',
    settings: {
      evmVersion: 'istanbul',
      metadata: {
        bytecodeHash: 'none',
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
    gasPrice: 10 * 1000000000,
    initialBaseFeePerGas: 0,
    saveDeployments: false,
  },
  ...Object.entries(SUPPORTED_NETWORKS)
    .map(([name, network]) => ({ name, ...network }))
    .reduce((result, { url, name, chainId }) => {
      const { useNamespace } = Envs.processEnvs;
      const { getEnvAsHex32, getEnvAsURL, getEnvAsNumber } = useNamespace(name);

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
          allowUnlimitedContractSize: true,
          saveDeployments: true,
        },
      };
    }, {}),
};
