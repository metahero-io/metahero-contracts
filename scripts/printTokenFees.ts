import { BigNumber } from 'ethers';
import { deployments, ethers } from 'hardhat';
import { MetaheroToken__factory as MetaheroTokenFactory } from '../typings';

const { getSigners } = ethers;

function printFee(label: string, fee: BigNumber): void {
  console.log(`> ${label}:`, `${fee.toString()}%`);
}

async function main(): Promise<void> {
  const { address: tokenAddress } = await deployments.get('MetaheroToken');
  const [owner] = await getSigners();

  if (tokenAddress && owner) {
    const token = MetaheroTokenFactory.connect(tokenAddress, owner);

    const tokenSettings = await token.settings();

    printFee('burn fee (sender)', tokenSettings.burnFees.sender);
    printFee('burn fee (recipient)', tokenSettings.burnFees.recipient);
    printFee('lp fee (sender)', tokenSettings.lpFees.sender);
    printFee('lp fee (recipient)', tokenSettings.lpFees.recipient);
    printFee('lp rewards (sender)', tokenSettings.rewardsFees.sender);
    printFee('lp rewards (recipient)', tokenSettings.rewardsFees.recipient);

    console.log();
  }
}

main().catch(console.error);
