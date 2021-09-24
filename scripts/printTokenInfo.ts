import { ethers } from 'hardhat';
import { connectToken, logger } from './common';

async function main(): Promise<void> {
  const [owner] = await ethers.getSigners();

  const token = await connectToken(owner);

  const { burnFees, lpFees, rewardsFees } = await token.settings();
  const {
    totalHolding, //
    totalExcluded,
    totalRewards,
    totalSupply,
  } = await token.summary();

  logger.info('token:');
  logger.log('address', token.address);
  logger.br();
  logger.info('settings:');
  logger.logPercents('burn.sender', burnFees.sender);
  logger.logPercents('burn.recipient', burnFees.recipient);
  logger.logPercents('lp.sender', lpFees.sender);
  logger.logPercents('lp.recipient', lpFees.recipient);
  logger.logPercents('rewards.sender', rewardsFees.sender);
  logger.logPercents('rewards.recipient', rewardsFees.recipient);
  logger.br();
  logger.info('summary:');
  logger.log('total holding', totalHolding);
  logger.log('total excluded', totalExcluded);
  logger.log('total rewards', totalRewards);
  logger.log('total supply', totalSupply);
  logger.br();
}

main().catch(console.error);
