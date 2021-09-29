import { deployments } from 'hardhat';
import { Signer, providers } from 'ethers';
import { ContractNames } from '../../../extensions';
import {
  MetaheroAirdrop,
  MetaheroAirdrop__factory as MetaheroAirdropFactory,
} from '../../../typings';

export async function connectAirdrop(
  signerOrProvider: Signer | providers.Provider,
): Promise<MetaheroAirdrop> {
  const { address } = await deployments.get(ContractNames.MetaheroAirdrop);
  return MetaheroAirdropFactory.connect(address, signerOrProvider);
}
