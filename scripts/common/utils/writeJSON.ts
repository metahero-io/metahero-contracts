import { makePath } from './makePath';
import { writeJSON as writeJSONBase } from 'fs-extra';

export async function writeJSON<T>(filePath: string, data: T): Promise<void> {
  try {
    await makePath(filePath);

    await writeJSONBase(filePath, data, {
      spaces: 2,
    });
  } catch (err) {
    //
  }
}
