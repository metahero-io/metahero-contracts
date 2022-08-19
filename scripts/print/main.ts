import { printFrontendEnvs } from './utils';
import { NETWORK } from './constants';

export async function main(): Promise<void> {
  console.log('# frontend envs');

  for (const { name, path } of NETWORK) {
    await printFrontendEnvs(name, path);
  }
}
