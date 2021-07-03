import { ethers, deployments } from 'hardhat';
import { utils } from 'ethers';
import { MetaheroPresale__factory as MetaheroPresaleFactory } from '../typings';
import { readLines, logTx } from './helpers';

const { getSigners } = ethers;

const FILE_NAME = 'presaleAccounts.csv';
const BATCH_SIZE = 50;

async function main(): Promise<void> {
  const addresses = await readLines(FILE_NAME, (address) => {
    let result: string;
    try {
      result = utils.getAddress(address);
    } catch (err) {
      result = null;
    }
    return result;
  });

  const { address: presaleAddress } = await deployments.get('MetaheroPresale');
  const [owner] = await getSigners();

  if (presaleAddress && owner) {
    const presale = MetaheroPresaleFactory.connect(presaleAddress, owner);

    const batch: {
      index: number;
      addresses: string[];
    } = {
      index: 1,
      addresses: [],
    };

    for (let i = 0; i < addresses.length; i++) {
      batch.addresses.push(addresses[i]);

      if (batch.addresses.length === BATCH_SIZE || i === addresses.length - 1) {
        await logTx(
          `Batch #${batch.index}, addresses:`,
          presale.addAccounts(batch.addresses),
          batch.addresses,
        );

        batch.index++;
        batch.addresses = [];
      }
    }
  }
}

main().catch(console.error);
