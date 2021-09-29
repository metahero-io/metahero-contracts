import { ethers } from 'hardhat';
import { BigNumber, utils } from 'ethers';
import {
  connectAirdrop,
  Logger,
  readJSON,
  writeJSON,
  processFile,
} from '../common';
import { getDataPath } from './utils';

const { getSigners } = ethers;

const DATE_INDEX = Math.floor(Date.now() / 1000);
const INPUT_DATA_FILE_PATH = getDataPath('input/data.csv');
const INPUT_SUMMARY_FILE_PATH = getDataPath('input/summary.json');
const OUTPUT_DATA_FILE_BASE = getDataPath('output/data/');
const OUTPUT_SUMMARY_FILE_PATH = getDataPath(
  `output/summary_${DATE_INDEX}.json`,
);

const GAS_LIMIT = 10000000;
const BATCH_SIZE = 50;

async function main(): Promise<void> {
  const [owner] = await getSigners();

  const logger = new Logger();
  const airdrop = await connectAirdrop(owner);

  const inputSummary = await readJSON<{
    totalBalance: string;
    totalWeights: string;
  }>(INPUT_SUMMARY_FILE_PATH);

  const totalBalance = utils.parseEther(inputSummary.totalBalance);
  const totalWeights = utils.parseEther(inputSummary.totalWeights);
  let totalTx = 0;
  let totalCost = BigNumber.from(0);
  let totalGasUsed = BigNumber.from(0);
  let totalRecipients = 0;
  let totalAmounts = BigNumber.from(0);

  let recipients: string[] = [];
  let amounts: BigNumber[] = [];

  const sendTx = async () => {
    if (recipients.length > 0) {
      try {
        const {
          cost,
          receipt: { gasUsed },
        } = await logger.logTx(
          `airdrop.batchTransfer #${++totalTx}`,
          airdrop.batchTransfer(recipients, amounts, {
            gasLimit: GAS_LIMIT,
          }),
          async (hash) => {
            for (let index = 0; index < recipients.length; index++) {
              const recipient = recipients[index];
              const amount = amounts[index];

              await writeJSON(`${OUTPUT_DATA_FILE_BASE}${recipient}.json`, {
                hash,
                recipient,
                amount: utils.formatEther(amount),
              });

              ++totalRecipients;
              totalAmounts = totalAmounts.add(amount);
            }
          },
        );

        totalCost = totalCost.add(cost);
        totalGasUsed = totalGasUsed.add(gasUsed);
      } catch (err) {
        logger.error(err);
      }

      recipients = [];
      amounts = [];

      logger.br();
    }
  };

  await processFile(
    INPUT_DATA_FILE_PATH,
    async (line, index, parts) => {
      const recipient = utils.getAddress(parts[0]);
      const weight = utils.parseEther(parts[1]);
      const amount = weight.mul(totalBalance).div(totalWeights);

      if (amount.eq(0)) {
        return;
      }

      if (await readJSON(`${OUTPUT_DATA_FILE_BASE}${recipient}.json`)) {
        return;
      }

      recipients.push(recipient);
      amounts.push(amount);

      if (recipients.length === BATCH_SIZE) {
        await sendTx();
      }
    },
    {
      csv: true,
    },
  );

  if (recipients.length > 0) {
    await sendTx();
  }

  await writeJSON(OUTPUT_SUMMARY_FILE_PATH, {
    totalRecipients,
    totalAmounts: utils.formatEther(totalAmounts),
    totalBalance: utils.formatEther(totalBalance),
    totalWeights: utils.formatEther(totalWeights),
  });

  logger.info('transactions:');
  logger.log('total count', totalTx);
  logger.log('total cost', totalCost);
  logger.log('total gas used', totalGasUsed.toString());
  logger.br();
  logger.info('summary:');
  logger.log('total recipients', totalRecipients);
  logger.log('total amounts', totalAmounts);
  logger.log('total balance', totalBalance);
  logger.log('total weights', totalWeights);
  logger.br();
}

main().catch(console.error);
