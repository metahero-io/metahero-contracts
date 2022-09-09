import { resolve, join } from 'path';

export const ROOT_PATH = resolve(process.cwd());
export const DIST_PATH = join(ROOT_PATH, 'dist');
export const DIST_CONSTANTS_JS_FILE_NAME = 'constants.js';
export const DIST_CONSTANTS_TS_FILE_NAME = 'constants.d.ts';
export const DIST_CONTRACTS_JS_FILE_NAME = 'contracts.js';
