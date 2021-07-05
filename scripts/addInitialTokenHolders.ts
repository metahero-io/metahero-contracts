import { BigNumber, utils } from 'ethers';
import { ethers, deployments } from 'hardhat';
import { MetaheroToken__factory as MetaheroTokenFactory } from '../typings';
import { readLines, logTx } from './helpers';

const { getSigners } = ethers;

const FILE_NAME = 'initialTokenHolders.csv';

interface Line {
  holder: string;
  balance: BigNumber;
}

async function main(): Promise<void> {
  const lines = await readLines<Line>(FILE_NAME, (line) => {
    let result: Line = null;

    if (line.startsWith('"0x')) {
      try {
        const parts = line.replace(/\"/gi, '').split(',');
        const holder = utils.getAddress(parts[0]);
        const balance = utils.parseEther(parts[1]);
        result = {
          holder,
          balance,
        };
      } catch (err) {
        console.error(err);
      }
    }

    return result;
  });

  const { address: tokenAddress } = await deployments.get('MetaheroToken');
  const [owner] = await getSigners();

  if (tokenAddress && owner) {
    const token = MetaheroTokenFactory.connect(tokenAddress, owner);
    let totalBalance = BigNumber.from(0);

    for (const { holder, balance } of lines) {
      totalBalance = totalBalance.add(balance);

      await logTx(
        `[MetaheroToken] Transfer ${balance.toString()} to ${holder}`,
        token.transfer(holder, balance),
      );
    }
  }
}

main().catch(console.error);
