import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import { getDataPath } from './getDataPath';

export async function processFile(
  fileName: string,
  processor: (line: string, index: number, parts?: string[]) => Promise<void>,
  options: {
    skipLines?: number;
    csv?: boolean;
  } = {},
): Promise<number> {
  const { skipLines, csv } = {
    skipLines: 0,
    ...options,
  };
  const filePath = getDataPath(fileName);

  const input = createReadStream(filePath);
  const rl = createInterface({
    input,
    crlfDelay: Infinity,
  });

  let index = 0;

  for await (let line of rl) {
    if (line && index >= skipLines) {
      let parts: string[] = null;

      if (csv) {
        parts = line
          .replace(/\"/gi, '')
          .replace(/[\,\;]/gi, '|')
          .split('|');
      }

      await processor(line, index + 1, parts);
    }

    ++index;
  }

  return index > skipLines ? index - skipLines : 0;
}
