import { deployments } from 'hardhat';
import { Signer, providers } from 'ethers';
import { ContractNames } from '../../../extensions';
import {
  MetaheroToken,
  MetaheroToken__factory as MetaheroTokenFactory,
} from '../../../typings';

export async function connectToken(
  signerOrProvider: Signer | providers.Provider,
): Promise<MetaheroToken> {
  const { address } = await deployments.get(ContractNames.MetaheroToken);
  return MetaheroTokenFactory.connect(address, signerOrProvider);
}
