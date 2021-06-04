import { ethers, waffle } from 'hardhat';
import HEROTokenArtifact from '../artifacts/HEROToken.json';
import { HEROToken } from '../typings';
import { SignerWithAddress } from './shared';

const { deployContract } = waffle;
const { getSigners } = ethers;

describe('HEROToken', () => {
  const totalSupply = '100000000000000000';
  let token: HEROToken;
  let signers: SignerWithAddress[];
  let excludedHolders: string[];

  beforeEach(async () => {
    signers = await getSigners();

    excludedHolders = [signers[1].address];

    token = (await deployContract(signers[0], HEROTokenArtifact)) as HEROToken;

    await token.initialize(
      { sender: 1, recipient: 1 },
      { sender: 1, recipient: 1 },
      5, // 5 sec
      1, // 1 %
      totalSupply,
      excludedHolders,
    );
  });

  context('transfer()', () => {
    it('expect to transfer from excluded to excluded ', async () => {
      const sender = signers[0];
      const recipient = signers[1];

      await token.connect(sender).transfer(recipient.address, 1000);
    });

    it('expect to transfer from excluded to holder ', async () => {
      const sender = signers[0];
      const recipient = signers[2];

      await token.connect(sender).transfer(recipient.address, 1000);
    });
  });
});
