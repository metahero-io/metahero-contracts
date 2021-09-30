import { ethers } from 'hardhat';
import { connectToken, connectAirdrop, Logger } from '../common';

async function main(): Promise<void> {
  const [owner] = await ethers.getSigners();

  const logger = new Logger();
  const token = await connectToken(owner);
  const airdrop = await connectAirdrop(owner);

  logger.info('airdrop:');
  logger.log('address', airdrop.address);
  logger.log('balance', await token.balanceOf(airdrop.address), 'HERO');
  logger.log('token.address', await airdrop.token());
  logger.log('owner.address', await airdrop.owner());
  logger.log('owner.balance', await owner.getBalance(), 'BNB');
  logger.br();
}

main().catch(console.error);
