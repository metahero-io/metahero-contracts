import { utils } from 'ethers';
import { ethers, deployments } from 'hardhat';
import { MetaheroToken__factory as MetaheroTokenFactory } from '../typings';
import { readLines, logTx } from './helpers';

const { getSigners } = ethers;

const FILE_NAME = 'excludedAccounts.csv';

async function main(): Promise<void> {
  const lines = await readLines<string>(FILE_NAME, (line) => {
    let result: string = null;

    if (line) {
      try {
        result = utils.getAddress(line);
      } catch (err) {
        //
      }
    }

    return result;
  });

  const { address: tokenAddress } = await deployments.get('MetaheroToken');
  const [owner] = await getSigners();

  if (tokenAddress && owner) {
    const token = MetaheroTokenFactory.connect(tokenAddress, owner);

    for (const address of lines) {
      await logTx(
        `[MetaheroToken] Exclude ${address} account`,
        token.excludeAccount(address, true, true),
      );
    }
  }
}

main().catch(console.error);
