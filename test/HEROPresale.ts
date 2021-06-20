import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import { BigNumber, constants } from 'ethers';
import HEROTokenArtifact from '../artifacts/HEROToken.json';
import HEROPresaleArtifact from '../artifacts/HEROPresale.json';
import { HEROToken, HEROPresale } from '../typings';
import {
  Signer,
  setNextBlockTimestamp,
  getBalance,
  calcTxCost,
  randomAddress,
} from './common';

const { deployContract } = waffle;
const { getSigners } = ethers;

describe('HEROPresale', () => {
  const TOKENS_AMOUNT_PER_NATIVE = BigNumber.from(10);
  const MAX_PURCHASE_PRICE = BigNumber.from(1000);
  const TOTAL_SUPPLY = BigNumber.from(100000000);
  const TOTAL_TOKENS = BigNumber.from(1000000);
  const DEADLINE_IN = 60; // 60 sec

  let token: HEROToken;
  let presale: HEROPresale;
  let owner: Signer;
  let external: Signer;
  let accounts: Signer[];
  let totalTokens = TOTAL_TOKENS;
  let deadline: number;

  const createBeforeHook = (initialize = true) => {
    before(async () => {
      [owner, external, ...accounts] = await getSigners();

      token = (await deployContract(owner, HEROTokenArtifact)) as HEROToken;

      presale = (await deployContract(
        owner,
        HEROPresaleArtifact,
      )) as HEROPresale;

      const fee = {
        sender: 0,
        recipient: 0,
      };

      await token.initialize(
        fee, //
        fee,
        constants.AddressZero,
        constants.AddressZero,
        TOTAL_SUPPLY,
        [
          presale.address, //
          ...accounts.map(({ address }) => address),
        ],
      );

      await token.transfer(presale.address, TOTAL_TOKENS);

      if (initialize) {
        deadline = (await setNextBlockTimestamp()) + DEADLINE_IN;

        await presale.initialize(
          token.address,
          TOKENS_AMOUNT_PER_NATIVE,
          MAX_PURCHASE_PRICE,
          DEADLINE_IN,
          accounts.map(({ address }) => address),
        );
      }
    });
  };

  context('# before initialization', () => {
    createBeforeHook(false);

    context('initialize()', () => {
      it('expect to initialize the whitelist', async () => {
        const tx = await presale.initialize(
          token.address,
          TOKENS_AMOUNT_PER_NATIVE,
          MAX_PURCHASE_PRICE,
          DEADLINE_IN,
          accounts.map(({ address }) => address),
        );

        expect(tx).to.emit(presale, 'Initialized');

        for (const { address } of accounts) {
          expect(tx).to.emit(presale, 'AccountAdded').withArgs(address);
        }

        expect(await token.balanceOf(presale.address)).to.equal(TOTAL_TOKENS);
      });

      it('expect to revert when whitelist is initialized', async () => {
        await expect(
          presale.initialize(
            token.address,
            TOKENS_AMOUNT_PER_NATIVE,
            MAX_PURCHASE_PRICE,
            DEADLINE_IN,
            accounts.map(({ address }) => address),
          ),
        ).to.be.revertedWith('Initializable#1');
      });
    });
  });

  context('# after initialization', () => {
    createBeforeHook(true);

    context('settings()', () => {
      it('expect to return correct settings', async () => {
        const output = await presale.settings();

        expect(output.tokensAmountPerNative).to.equal(TOKENS_AMOUNT_PER_NATIVE);
        expect(output.maxPurchasePrice).to.equal(MAX_PURCHASE_PRICE);
      });
    });

    context('summary()', () => {
      it('expect to return correct summary', async () => {
        const output = await presale.summary();

        expect(output.totalAccounts).to.equal(accounts.length);
        expect(output.totalTokens).to.equal(totalTokens);
      });
    });

    context('deadline()', () => {
      it('expect to return correct deadline', async () => {
        const output = await presale.deadline();

        expect(output).to.equal(deadline);
      });
    });

    context('addAccounts()', () => {
      const ACCOUNTS = [
        randomAddress(), //
        randomAddress(),
        randomAddress(),
      ];

      it('expect to add accounts to whitelist', async () => {
        const tx = await presale.addAccounts(ACCOUNTS);

        for (const account of ACCOUNTS) {
          expect(tx).to.emit(presale, 'AccountAdded').withArgs(account);
        }
      });
    });

    context('removeAccounts()', () => {
      const ACCOUNTS = [
        randomAddress(), //
        randomAddress(),
        randomAddress(),
      ];

      before(async () => {
        await presale.addAccounts(ACCOUNTS);
      });

      it('expect to remove accounts to whitelist', async () => {
        const tx = await presale.removeAccounts(ACCOUNTS);

        for (const account of ACCOUNTS) {
          expect(tx).to.emit(presale, 'AccountRemoved').withArgs(account);
        }
      });
    });

    context('# before deadline', () => {
      context('buy tokens', () => {
        let account: Signer;

        before(() => {
          account = accounts.pop();
        });

        it('expect to revert when sender is not on the whitelist', async () => {
          await expect(
            external.sendTransaction({
              to: presale.address,
              value: 1,
            }),
          ).to.be.revertedWith('HEROPresale#2');
        });

        it('expect to revert on invalid msg.value', async () => {
          await expect(
            account.sendTransaction({
              to: presale.address,
              value: 0,
            }),
          ).to.be.revertedWith('HEROPresale#3');
        });

        it('expect to buy tokens', async () => {
          expect(await presale.whitelist(account.address)).to.be.true;

          const tokensPrice = 10;
          const tokensAmount = TOKENS_AMOUNT_PER_NATIVE.mul(tokensPrice);

          const tx = await account.sendTransaction({
            to: presale.address,
            value: tokensPrice,
          });

          expect(tx).to.emit(presale, 'TokensPurchased').withArgs(
            account.address, //
            tokensPrice,
            tokensAmount,
          );

          expect(await token.balanceOf(account.address)).to.be.equal(
            tokensAmount,
          );

          expect(await presale.whitelist(account.address)).to.be.false;

          totalTokens = totalTokens.sub(tokensAmount);
        });
      });

      context('finishPresale()', () => {
        it('expect to revert before deadline', async () => {
          await expect(presale.finishPresale()).to.be.revertedWith(
            'HEROPresale#9',
          );
        });
      });
    });

    context('# after deadline', () => {
      before(async () => {
        await setNextBlockTimestamp(deadline + DEADLINE_IN);
      });

      context('buy tokens', () => {
        it('expect to revert before deadline', async () => {
          const account = accounts.pop();

          await expect(
            account.sendTransaction({
              to: presale.address,
              value: 1,
            }),
          ).to.be.revertedWith('HEROPresale#1');
        });
      });

      context('finishPresale()', async () => {
        it('expect to finish presale', async () => {
          const summaryBefore = await token.summary();
          const ownerBalance = await getBalance(owner);
          const presaleBalance = await getBalance(presale);
          const presaleTokens = await token.balanceOf(presale.address);

          const tx = await presale.finishPresale();
          const txCost = await calcTxCost(tx);

          const summaryAfter = await token.summary();

          expect(await summaryAfter.totalSupply).to.equal(
            summaryBefore.totalSupply.sub(presaleTokens),
          );

          expect(await summaryAfter.totalExcluded).to.equal(
            summaryBefore.totalExcluded.sub(presaleTokens),
          );

          expect(await token.balanceOf(presale.address)).to.equal(0);

          expect(await getBalance(presale)).to.equal(0);
          expect(await getBalance(owner)).to.equal(
            ownerBalance.add(presaleBalance).sub(txCost),
          );
        });
      });
    });
  });
});
