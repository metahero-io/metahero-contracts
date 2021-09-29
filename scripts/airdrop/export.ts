import { BigNumber, utils } from 'ethers';
import { readJSON, processFile, createCSVWriter } from '../common';
import { getDataPath } from './utils';

const INPUT_DATA_FILE_PATH = getDataPath('input/data.csv');
const OUTPUT_DATA_FILE_BASE = getDataPath('output/data/');
const OUTPUT_EXPORT_FILE_PATH = getDataPath('output/export.csv');

async function main(): Promise<void> {
  const writer = createCSVWriter(OUTPUT_EXPORT_FILE_PATH);

  writer.write(
    'Recipient Address',
    'Recipient Weight',
    'Airdrop Amount',
    'Transaction Hash',
  );

  await processFile(
    INPUT_DATA_FILE_PATH,
    async (line, index, parts) => {
      const recipient = utils.getAddress(parts[0]);
      const weight = utils.parseEther(parts[1]);

      const data = await readJSON<{
        hash;
        amount: string;
      }>(`${OUTPUT_DATA_FILE_BASE}${recipient}.json`);

      let hash = '';
      let amount: BigNumber = null;

      if (data) {
        ({ hash } = data);
        amount = utils.parseEther(data.amount);
      }

      writer.write(recipient, weight, amount, hash);
    },
    {
      csv: true,
    },
  );
}

main().catch(console.error);
