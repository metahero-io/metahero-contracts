import { resolve } from 'path';

export const OUTPUT_ROOT = resolve(process.cwd(), 'release');
export const OUTPUT_CONSTANTS_JS_FILE_NAME = 'constants.js';
export const OUTPUT_CONSTANTS_TS_FILE_NAME = 'constants.d.ts';
export const OUTPUT_CONTRACTS_JS_FILE_NAME = 'contracts.js';

export const PACKAGES_ROOT = resolve(process.cwd(), 'packages');

export const DEPLOYMENTS_DIR = 'deployments';
export const DEPLOYMENTS_CHAIN_ID_FILE = '.chainId';
export const DEPLOYMENTS_FILE_EXT = '.json';
