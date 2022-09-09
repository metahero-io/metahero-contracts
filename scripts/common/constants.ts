import { resolve } from 'path';

export const PACKAGES_ROOT = resolve(process.cwd(), 'packages');

export const DEPLOYMENTS_DIR = 'deployments';
export const DEPLOYMENTS_CHAIN_ID_FILE = '.chainId';
export const DEPLOYMENTS_FILE_EXT = '.json';
export const DEPLOYMENTS_KNOWN_CONTRACTS_FILE = `knownContracts${DEPLOYMENTS_FILE_EXT}`;
