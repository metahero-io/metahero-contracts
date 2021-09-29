import { dirname } from 'path';
import { mkdirp } from 'fs-extra';

export async function makePath(path: string): Promise<void> {
  try {
    await mkdirp(dirname(path));
  } catch (err) {
    //
  }
}
