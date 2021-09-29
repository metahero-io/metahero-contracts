import { ethers } from 'hardhat';
import { BigNumber, utils } from 'ethers';
import {
  connectToken,
  connectAirdrop,
  Logger,
  writeJSON,
  processFile,
  createCSVWriter,
} from '../common';
import { getDataPath } from './utils';

const { getSigners } = ethers;

const DATA_FILE_PATH = getDataPath('input/data.csv');
const SUMMARY_FILE_PATH = getDataPath('input/summary.json');
const RAW_FILE_PATH = getDataPath('input/raw.csv');

async function main(): Promise<void> {
  const [owner] = await getSigners();

  const logger = new Logger();
  const airdrop = await connectAirdrop(owner);
  const token = await connectToken(owner);

  const totalBalance = await token.balanceOf(airdrop.address);
  let totalRecipients = 0;
  let totalWeights = BigNumber.from(0);

  const writer = createCSVWriter(DATA_FILE_PATH);

  await processFile(
    RAW_FILE_PATH,
    async (line, index, parts) => {
      const recipient = utils.getAddress(parts[0]);
      const weight = utils.parseEther(parts[1]);

      totalWeights = totalWeights.add(weight);

      writer.write(recipient, weight);

      ++totalRecipients;
    },
    {
      csv: true,
    },
  );

  await writeJSON(SUMMARY_FILE_PATH, {
    totalRecipients,
    totalBalance: utils.formatEther(totalBalance),
    totalWeights: utils.formatEther(totalWeights),
  });

  logger.info('summary:');
  logger.log('total recipients', totalRecipients);
  logger.log('total balance', totalBalance);
  logger.log('total weights', totalWeights);
  logger.br();
}

main().catch(console.error);
