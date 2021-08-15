import { BigNumber } from 'ethers';
import { deployments, ethers } from 'hardhat';
import { MetaheroToken__factory as MetaheroTokenFactory } from '../typings';

const { getSigners } = ethers;

function logFee(label: string, fee: BigNumber): void {
  console.log(`> ${label}:`, `${fee.toString()}%`);
}

async function main(): Promise<void> {
  const { address: tokenAddress } = await deployments.get('MetaheroToken');
  const [owner] = await getSigners();

  if (tokenAddress && owner) {
    const token = MetaheroTokenFactory.connect(tokenAddress, owner);

    const tokenSettings = await token.settings();

    logFee('burn fee (sender)', tokenSettings.burnFees.sender);
    logFee('burn fee (recipient)', tokenSettings.burnFees.recipient);
    logFee('lp fee (sender)', tokenSettings.lpFees.sender);
    logFee('lp fee (recipient)', tokenSettings.lpFees.recipient);
    logFee('lp rewards (sender)', tokenSettings.rewardsFees.sender);
    logFee('lp rewards (recipient)', tokenSettings.rewardsFees.recipient);
  }
}

main().catch(console.error);
