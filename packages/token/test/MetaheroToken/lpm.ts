import { BigNumber, constants } from 'ethers';
import { ethers, helpers } from 'hardhat';
import { expect } from 'chai';
import { MetaheroLPMMock, MetaheroToken } from '../../typechain';
import { Signer } from '../helpers';

const { getSigners } = ethers;

const { deployContract } = helpers;

context('MetaheroToken', () => {
  context('# lpm', () => {
    const TOTAL_SUPPLY = BigNumber.from('10000000000000');
    const ZERO_FEE = {
      sender: 0,
      recipient: 0,
    };
    const LP_FEE = {
      sender: 3,
      recipient: 3,
    };

    let excluded: Signer[];
    let holders: Signer[];
    let token: MetaheroToken;
    let lpm: MetaheroLPMMock;

    before(async () => {
      let signers = await getSigners();

      [, ...signers] = signers;

      excluded = signers.slice(0, 2);
      holders = signers.slice(2);

      token = await deployContract('MetaheroToken');

      lpm = await deployContract('MetaheroLPMMock');

      await token.initialize(
        ZERO_FEE,
        LP_FEE,
        ZERO_FEE,
        0,
        lpm.address,
        constants.AddressZero,
        TOTAL_SUPPLY,
        excluded.map(({ address }) => address),
      );

      await token.transfer(excluded[0].address, TOTAL_SUPPLY);

      await lpm.initialize(token.address);

      await token.setPresaleAsFinished();
    });

    context('transfer()', () => {
      context('# between holder accounts', () => {
        const amount = 100000;
        let sender: Signer;
        let recipient: Signer;

        before(async () => {
          sender = holders.pop();
          recipient = holders.pop();

          await token.connect(excluded[0]).transfer(sender.address, amount);
        });

        it('expect to sync lp', async () => {
          const tx = await token
            .connect(sender)
            .transfer(recipient.address, amount / 2);

          expect(tx).to.emit(lpm, 'LPSynced');
        });
      });

      context('_transferFromExcludedAccount()', () => {
        let sender: Signer;
        let recipient: Signer;

        before(async () => {
          sender = excluded[0];
          recipient = holders.pop();
        });

        it('expect to sync lp before transfer', async () => {
          await lpm.allowSyncLP(true, false);

          const tx = await token
            .connect(sender)
            .transfer(recipient.address, 100);

          expect(tx).to.emit(lpm, 'LPSynced');
        });

        it('expect to sync lp after transfer', async () => {
          await lpm.allowSyncLP(false, true);

          const tx = await token
            .connect(sender)
            .transfer(recipient.address, 100);

          expect(tx).to.emit(lpm, 'LPSynced');
        });

        it('expect not to sync lp', async () => {
          await lpm.allowSyncLP(false, false);

          const tx = await token
            .connect(sender)
            .transfer(recipient.address, 100);

          expect(tx).not.to.emit(lpm, 'LPSynced');
        });
      });
    });

    context('_transferToExcludedAccount()', () => {
      const amount = 100000;
      let sender: Signer;
      let recipient: Signer;

      before(async () => {
        sender = holders.pop();
        recipient = excluded[1];

        await token.connect(excluded[0]).transfer(sender.address, amount);
      });

      it('expect to sync lp before transfer', async () => {
        await lpm.allowSyncLP(true, false);

        const tx = await token
          .connect(sender)
          .transfer(recipient.address, amount / 100);

        expect(tx).to.emit(lpm, 'LPSynced');
      });

      it('expect to sync lp after transfer', async () => {
        await lpm.allowSyncLP(false, true);

        const tx = await token
          .connect(sender)
          .transfer(recipient.address, amount / 100);

        expect(tx).to.emit(lpm, 'LPSynced');
      });

      it('expect not to sync lp', async () => {
        await lpm.allowSyncLP(false, false);

        const tx = await token
          .connect(sender)
          .transfer(recipient.address, amount / 100);

        expect(tx).not.to.emit(lpm, 'LPSynced');
      });
    });
  });
});
