import { BigNumber, utils } from 'ethers';
import { createWriteStream as createWriteStreamBase } from 'fs';

export function createCSVWriter(filePath: string): {
  write(...args: any[]): void;
} {
  const writeSteam = createWriteStreamBase(filePath);

  return {
    write: (...args) => {
      let chunk = args
        .map((arg: any) => {
          let result = '';

          if (arg) {
            if (BigNumber.isBigNumber(arg)) {
              result = utils.formatEther(arg);
            } else {
              switch (typeof arg) {
                case 'number':
                  result = `${arg}`;
                  break;

                default:
                  result = `"${arg}"`;
              }
            }
          }

          return result;
        })
        .join(',');

      chunk = `${chunk}\n`;

      writeSteam.write(chunk);
    },
  };
}
