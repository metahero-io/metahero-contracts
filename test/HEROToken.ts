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

  before(async () => {
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
    const logBalances = async (
      sender: SignerWithAddress,
      recipient: SignerWithAddress,
    ) => {
      const senderBalance = await token.balanceOf(sender.address);
      const recipientBalance = await token.balanceOf(recipient.address);

      console.log('senderBalance:', senderBalance.toString());
      console.log('recipientBalance:', recipientBalance.toString());
    };

    it('expect to transfer from excluded to excluded ', async () => {
      const sender = signers[0];
      const recipient = signers[1];
      const amount = 1000;

      await token.connect(sender).transfer(recipient.address, amount);

      await logBalances(sender, recipient);
    });

    it('expect to transfer from excluded to holder #1', async () => {
      const sender = signers[0];
      const recipient = signers[2];
      const amount = 1000;

      await token.connect(sender).transfer(recipient.address, amount);

      await logBalances(sender, recipient);
    });

    it('expect to transfer from excluded to holder #2', async () => {
      const sender = signers[0];
      const recipient = signers[3];
      const amount = 1000;

      await token.connect(sender).transfer(recipient.address, amount);

      await logBalances(sender, recipient);
    });

    it('expect to transfer from holder to holder #1', async () => {
      const sender = signers[3];
      const recipient = signers[4];
      const amount = 100;

      await token.connect(sender).transfer(recipient.address, amount);

      await logBalances(sender, recipient);
    });

    it('expect to transfer from holder to holder #2', async () => {
      const sender = signers[3];
      const recipient = signers[5];
      const amount = 200;

      await token.connect(sender).transfer(recipient.address, amount);

      await logBalances(sender, recipient);
    });

    it('expect to transfer from holder to excluded', async () => {
      const sender = signers[3];
      const recipient = signers[1];
      const amount = 200;

      await token.connect(sender).transfer(recipient.address, amount);

      await logBalances(sender, recipient);
    });
  });
});
