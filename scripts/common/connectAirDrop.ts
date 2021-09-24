import { deployments } from 'hardhat';
import { Signer, providers } from 'ethers';
import {
  MetaheroAirDrop,
  MetaheroAirDrop__factory as MetaheroAirDropFactory,
} from '../../typings';

export async function connectAirDrop(
  signerOrProvider: Signer | providers.Provider,
): Promise<MetaheroAirDrop> {
  const { address } = await deployments.get('MetaheroAirDrop');
  return MetaheroAirDropFactory.connect(address, signerOrProvider);
}
