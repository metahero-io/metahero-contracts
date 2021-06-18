import { join } from 'path';
import { readFile } from 'fs-extra';
import { network, ethers, deployments } from 'hardhat';
import { utils } from 'ethers';
import {
  HEROPresale,
  HEROPresale__factory as HEROPresaleFactory,
} from '../typings';

const { name } = network;
const { getSigners } = ethers;

const BATCH_SIZE = 100;
const DATA_FILE_NAME = 'presaleAccounts.csv';

async function main(): Promise<void> {
  let addresses: string[];

  const dataFilePath = join(__dirname, 'data', name, DATA_FILE_NAME);

  try {
    const content = await readFile(dataFilePath, { encoding: 'utf8' });

    addresses = content
      .split('\n')
      .map((address) => {
        let result: string;

        try {
          result = utils.getAddress(address);
        } catch (err) {
          //
        }

        return result;
      })
      .filter((address) => address);
  } catch (err) {
    //
  }

  const { address } = await deployments.get('HEROPresale');
  const [sender] = await getSigners();

  if (sender) {
    const presale = HEROPresaleFactory.connect(address, sender);

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
        console.log(`batch #${batch.index} addresses:`, batch.addresses);

        const tx = await presale.addAccounts(batch.addresses);
        await tx.wait();

        batch.index++;
        batch.addresses = [];
      }
    }
  }
}

main().catch(console.error);
