import { BigNumber, utils } from 'ethers';
import { createWriteStream } from 'fs';
import {
  processFile,
  getDataPath,
  logger,
  EXCLUDED_ACCOUNTS_MAP,
} from './common';

const RAW_FILE_NAME = 'airdrop-raw.csv';
const INPUT_FILE_NAME = 'airdrop-input.csv';
const INPUT_FILE_HEADER = Buffer.from(
  `"Recipient Address","Recipient Weight"`,
  'utf8',
);
const MIN_WEIGHT = utils.parseEther('5000');

async function main(): Promise<void> {
  let totalSkips = 0;
  let totalRecipients = 0;
  let totalWeight = BigNumber.from(0);

  const inputFile = createWriteStream(getDataPath(INPUT_FILE_NAME));

  inputFile.write(INPUT_FILE_HEADER);

  const logSkip = (reason: string) => {
    ++totalSkips;
    logger.log(`skipping (${reason})...`);
    logger.br();
  };

  const totalLines = await processFile(
    RAW_FILE_NAME,
    async (line, index, parts) => {
      logger.info(`#${index}`);

      try {
        if (line.indexOf('E-') > 0) {
          logSkip('invalid amount');
          return;
        }

        const recipient = utils.getAddress(parts[0]);
        const weight = utils.parseEther(parts[1]);

        if (!recipient) {
          logSkip('invalid recipient');
          return;
        }

        if (EXCLUDED_ACCOUNTS_MAP[recipient]) {
          logSkip('excluded account');
          return;
        }

        if (weight.lt(MIN_WEIGHT)) {
          logSkip('min weight');
          return;
        }

        ++totalRecipients;
        totalWeight = totalWeight.add(weight);

        logger.log('recipient', recipient);
        logger.log('weight', weight);

        line = `"${recipient}",${weight.toString()}\n`;

        inputFile.write(Buffer.from(line, 'utf8'));
      } catch (err) {
        logger.error(err);
      }

      logger.br();
    },
    {
      skipLines: 1,
      csv: true,
    },
  );

  logger.info('summary:');
  logger.log('totalLines', totalLines);
  logger.log('totalSkips', totalSkips);
  logger.log('totalRecipients', totalRecipients);
  logger.log('totalWeight', totalWeight);

  inputFile.close();
}

main().catch(console.error);
