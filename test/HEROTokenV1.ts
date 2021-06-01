import { ethers, waffle } from 'hardhat';
import chai from 'chai';
import HEROTokenArtifact from '../artifacts/HEROTokenV1.json';
import { HEROTokenV1 } from '../typings';
import { SignerWithAddress } from './shared';

const { deployContract } = waffle;
const { expect } = chai;
const { getSigners } = ethers;

describe('HEROTokenV1', () => {
  const totalSupply = '100000000000000000';
  let token: HEROTokenV1;
  let signers: SignerWithAddress[];

  beforeEach(async () => {
    signers = await getSigners();

    token = (await deployContract(
      signers[0],
      HEROTokenArtifact,
    )) as HEROTokenV1;

    await token.initialize(
      { sender: 1, recipient: 1 },
      { sender: 1, recipient: 1 },
      0,
      totalSupply,
    );
  });

  it('expect to return correct balance for deployer account', async () => {
    const balance = await token.balanceOf(signers[0].address);

    expect(balance).to.eq(totalSupply);
  });
});
