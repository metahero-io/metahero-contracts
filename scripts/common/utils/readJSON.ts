import { readJSON as readJSONBase } from 'fs-extra';

export async function readJSON<T>(filePath: string): Promise<T> {
  let result: T = null;

  try {
    result = await readJSONBase(filePath, {
      throws: true,
    });
  } catch (err) {
    //
  }

  return result;
}
