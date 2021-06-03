import { ethers, waffle } from 'hardhat';
import chai from 'chai';
import HEROTokenArtifact from '../artifacts/HEROToken.json';
import { HEROToken } from '../typings';
import { SignerWithAddress } from './shared';

const { deployContract } = waffle;
const { expect } = chai;
const { getSigners } = ethers;

describe('HEROToken', () => {
  const totalSupply = '100000000000000000';
  let token: HEROToken;
  let signers: SignerWithAddress[];

  beforeEach(async () => {
    signers = await getSigners();

    token = (await deployContract(signers[0], HEROTokenArtifact)) as HEROToken;

    await token.initialize(
      { sender: 1, recipient: 1 },
      { sender: 1, recipient: 1 },
      5, // 5 sec
      1, // 1 %
      totalSupply,
    );
  });

  it('expect to return correct balance for deployer account', async () => {
    const balance = await token.balanceOf(signers[0].address);

    expect(balance).to.eq(totalSupply);
  });
});
