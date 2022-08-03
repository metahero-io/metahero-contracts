/* eslint-disable no-unused-vars */

export const HARDHAT_MNEMONIC =
  'test test test test test test test test test test test junk';

export const HARDHAT_PATH_PREFIX = `m/44'/60'/0'/0/`;

export enum NetworkNames {
  Bsc = 'bsc',
  BscTest = 'bsc-test',
  Local = 'local',
}

export enum ProcessEnvNames {
  SaveLocalDeployments = 'SAVE_LOCAL_DEPLOYMENTS',
  PrivateKey = 'PRIVATE_KEY',
  DefaultGasPrice = 'DEFAULT_GAS_PRICE',
  Url = 'URL',
}