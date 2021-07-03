import { ethers, deployments } from 'hardhat';
import { MetaheroPresale__factory as MetaheroPresaleFactory } from '../typings';
import { logTx } from './helpers';

const { getSigners } = ethers;

async function main(): Promise<void> {
  const { address: presaleAddress } = await deployments.get('MetaheroPresale');
  const [owner] = await getSigners();

  if (presaleAddress && owner) {
    const presale = MetaheroPresaleFactory.connect(presaleAddress, owner);

    if (await presale.started()) {
      console.log('Presale already stared');
      return;
    }

    await logTx('Starting presale', presale.startPresale());
  }
}

main().catch(console.error);
