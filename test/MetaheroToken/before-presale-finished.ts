import { constants } from 'ethers';
import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import MetaheroTokenArtifact from '../../artifacts/MetaheroToken.json';
import { MetaheroToken } from '../../typings';
import { Signer, randomAddress } from '../helpers';

const { deployContract } = waffle;
const { getSigners } = ethers;

describe('MetaheroToken', () => {
  describe('# before presale finished', () => {
    const ZERO_FEE = {
      sender: 0,
      recipient: 0,
    };
    const TRANSFER_AMOUNT = 1000;

    let owner: Signer;
    let signers: Signer[];
    let holder: Signer;
    let token: MetaheroToken;

    const createBeforeHook = () => {
      before(async () => {
        signers = await getSigners();

        [owner, holder, ...signers] = signers;

        token = (await deployContract(
          owner,
          MetaheroTokenArtifact,
        )) as MetaheroToken;

        await token.initialize(
          ZERO_FEE,
          ZERO_FEE,
          ZERO_FEE,
          0,
          constants.AddressZero,
          constants.AddressZero,
          TRANSFER_AMOUNT,
          [],
        );

        await token.transfer(holder.address, TRANSFER_AMOUNT);
      });
    };

    context('presaleFinished()', () => {
      createBeforeHook();

      it('expect to return false when presale is not finished', async () => {
        expect(await token.presaleFinished()).to.be.false;
      });

      it('expect to return true when presale is finished', async () => {
        await token.setPresaleAsFinished();

        expect(await token.presaleFinished()).to.be.true;
      });
    });

    context('setPresaleAsFinished()', () => {
      createBeforeHook();

      it('expect to revert when sender is not the owner', async () => {
        const signer = signers.pop();
        await expect(
          token.connect(signer).setPresaleAsFinished(),
        ).to.be.revertedWith('Owned#1');
      });

      it('expect to finish the presale', async () => {
        const tx = await token.setPresaleAsFinished();

        expect(tx).to.emit(token, 'PresaleFinished');
      });

      it('expect to revert when presale is finished', async () => {
        await expect(token.setPresaleAsFinished()).to.be.revertedWith(
          'MetaheroToken#5',
        );
      });
    });

    context('transfer()', () => {
      createBeforeHook();

      it('expect to revert on transfer from holder account before presale is finished', async () => {
        await expect(
          token.connect(holder).transfer(randomAddress(), TRANSFER_AMOUNT),
        ).to.be.revertedWith('MetaheroToken#20');
      });

      it('expect to transfer from holder account when presale is finished', async () => {
        await token.setPresaleAsFinished();
        const recipient = randomAddress();
        const tx = await token
          .connect(holder)
          .transfer(recipient, TRANSFER_AMOUNT);

        expect(tx)
          .to.emit(token, 'Transfer')
          .withArgs(holder.address, recipient, TRANSFER_AMOUNT);
      });
    });
  });
});
