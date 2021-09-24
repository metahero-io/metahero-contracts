import { createWriteStream } from 'fs';
import { ethers } from 'hardhat';
import { BigNumber, utils } from 'ethers';
import {
  connectToken,
  connectAirDrop,
  processFile,
  logger,
  getDataPath,
} from './common';

const INPUT_FILE_NAME = 'airdrop-input.csv';
const OUTPUT_FILE_NAME = 'airdrop-output.csv';
const OUTPUT_FILE_HEADER = Buffer.from(
  `"Recipient Address","Recipient Weight","AirDrop Amount","Transaction Hash"`,
  'utf8',
);
const BATCH_SIZE = 30;

async function main(): Promise<void> {
  const [owner] = await ethers.getSigners();

  const token = await connectToken(owner);
  const airDrop = await connectAirDrop(owner);

  const outputFile = createWriteStream(getDataPath(OUTPUT_FILE_NAME));

  outputFile.write(OUTPUT_FILE_HEADER);

  const totalBalance = await token.balanceOf(airDrop.address);
  let totalTx = 0;
  let totalCost = BigNumber.from(0);
  let totalGasUsed = BigNumber.from(0);
  let totalWeight = BigNumber.from(0);

  const totalLines = await processFile(
    INPUT_FILE_NAME,
    async (line, index, parts) => {
      try {
        totalWeight = totalWeight.add(BigNumber.from(parts[1]));
      } catch (err) {
        logger.error(err);
      }
    },
    {
      skipLines: 1,
      csv: true,
    },
  );

  let recipients: string[] = [];
  let weights: BigNumber[] = [];
  let amounts: BigNumber[] = [];

  const process = async (force = false) => {
    if (recipients.length && (force || recipients.length === BATCH_SIZE)) {
      if (!force) {
        logger.br();
      }

      ++totalTx;

      const {
        cost,
        receipt: { gasUsed },
        tx: { hash },
      } = await logger.logTx(
        `airDrop.batchTransfer #${totalTx}`,
        airDrop.batchTransfer(recipients, amounts),
      );

      totalCost = totalCost.add(cost);
      totalGasUsed = totalGasUsed.add(gasUsed);

      for (let i = 0; i < recipients.length; i++) {
        const line = `"${recipients[i]}",${weights[i].toString()},${amounts[
          i
        ].toString()},"${hash}"\n`;

        outputFile.write(Buffer.from(line, 'utf8'));
      }

      recipients = [];
      weights = [];
      amounts = [];

      if (force) {
        logger.br();
      }
    }
  };

  await processFile(
    INPUT_FILE_NAME,
    async (line, index, parts) => {
      logger.info(`#${index}`);

      try {
        const recipient = utils.getAddress(parts[0]);
        const weight = BigNumber.from(parts[1]);
        const amount = totalBalance.mul(weight).div(totalWeight);

        logger.log('recipient', recipient);
        logger.log('weight', weight.toString());
        logger.log('amount', amount);

        if (amount.gt(0)) {
          recipients.push(recipient);
          weights.push(weight);
          amounts.push(amount);
        }

        await process();
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

  await process(true);

  logger.info('summary:');
  logger.log('totalTx', totalTx);
  logger.log('totalGasUsed', totalGasUsed.toString());
  logger.log('totalCost', totalCost);
  logger.log('totalLines', totalLines);
  logger.log('totalWeight', totalWeight.toString());
  logger.log('totalBalance (pre)', totalBalance);
  logger.log('totalBalance (post)', await token.balanceOf(airDrop.address));
}

main().catch(console.error);
