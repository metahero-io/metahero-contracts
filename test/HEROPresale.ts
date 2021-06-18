import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import { BigNumber } from 'ethers';
import HEROTokenEconomyMockArtifact from '../artifacts/HEROTokenEconomyMock.json';
import HEROPresaleArtifact from '../artifacts/HEROPresale.json';
import { HEROTokenEconomyMock, HEROPresale } from '../typings';
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
  const TOTAL_TOKENS = BigNumber.from(1000000);
  const DEADLINE_IN = 60; // 60 sec

  let token: HEROTokenEconomyMock;
  let whitelist: HEROPresale;
  let controller: Signer;
  let external: Signer;
  let accounts: Signer[];
  let totalTokens = TOTAL_TOKENS;
  let deadline: number;

  const createBeforeHook = (initialize = true) => {
    before(async () => {
      [controller, external, ...accounts] = await getSigners();

      token = (await deployContract(
        controller,
        HEROTokenEconomyMockArtifact,
      )) as HEROTokenEconomyMock;

      whitelist = (await deployContract(
        controller,
        HEROPresaleArtifact,
      )) as HEROPresale;

      const fee = {
        sender: 0,
        recipient: 0,
      };

      await token.initialize(
        fee, //
        fee,
        0,
        [
          whitelist.address, //
          ...accounts.map(({ address }) => address),
        ],
      );

      await token.transfer(whitelist.address, TOTAL_TOKENS);

      if (initialize) {
        deadline = (await setNextBlockTimestamp()) + DEADLINE_IN;

        await whitelist.initialize(
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
        const tx = await whitelist.initialize(
          token.address,
          TOKENS_AMOUNT_PER_NATIVE,
          MAX_PURCHASE_PRICE,
          DEADLINE_IN,
          accounts.map(({ address }) => address),
        );

        expect(tx).to.emit(whitelist, 'Initialized');

        for (const { address } of accounts) {
          expect(tx).to.emit(whitelist, 'AccountAdded').withArgs(address);
        }

        expect(await token.balanceOf(whitelist.address)).to.equal(TOTAL_TOKENS);
      });

      it('expect to revert when whitelist is initialized', async () => {
        await expect(
          whitelist.initialize(
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
        const output = await whitelist.settings();

        expect(output.tokensAmountPerNative).to.equal(TOKENS_AMOUNT_PER_NATIVE);
        expect(output.maxPurchasePrice).to.equal(MAX_PURCHASE_PRICE);
      });
    });

    context('summary()', () => {
      it('expect to return correct summary', async () => {
        const output = await whitelist.summary();

        expect(output.totalAccounts).to.equal(accounts.length);
        expect(output.totalTokens).to.equal(totalTokens);
      });
    });

    context('deadline()', () => {
      it('expect to return correct deadline', async () => {
        const output = await whitelist.deadline();

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
        const tx = await whitelist.addAccounts(ACCOUNTS);

        for (const account of ACCOUNTS) {
          expect(tx).to.emit(whitelist, 'AccountAdded').withArgs(account);
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
        await whitelist.addAccounts(ACCOUNTS);
      });

      it('expect to remove accounts to whitelist', async () => {
        const tx = await whitelist.removeAccounts(ACCOUNTS);

        for (const account of ACCOUNTS) {
          expect(tx).to.emit(whitelist, 'AccountRemoved').withArgs(account);
        }
      });
    });

    context('# before deadline', () => {
      context('buyTokens()', () => {
        let account: Signer;

        before(() => {
          account = accounts.pop();
        });

        it('expect to revert when sender is not on the whitelist', async () => {
          await expect(
            whitelist.connect(external).buyTokens(),
          ).to.be.revertedWith('HEROPresale#2');
        });

        it('expect to revert on invalid msg.value', async () => {
          await expect(
            whitelist.connect(account).buyTokens(),
          ).to.be.revertedWith('HEROPresale#3');
        });

        it('expect to buy tokens', async () => {
          expect(await whitelist.whitelist(account.address)).to.be.true;

          const tokensPrice = 10;
          const tokensAmount = TOKENS_AMOUNT_PER_NATIVE.mul(tokensPrice);

          const tx = await whitelist.connect(account).buyTokens({
            value: tokensPrice,
          });

          expect(tx).to.emit(whitelist, 'TokensPurchased').withArgs(
            account.address, //
            tokensPrice,
            tokensAmount,
          );

          expect(await token.balanceOf(account.address)).to.be.equal(
            tokensAmount,
          );

          expect(await whitelist.whitelist(account.address)).to.be.false;
        });
      });

      context('finishPresale()', () => {
        it('expect to revert before deadline', async () => {
          await expect(whitelist.finishPresale()).to.be.revertedWith(
            'HEROPresale#9',
          );
        });
      });
    });

    context('# after deadline', () => {
      before(async () => {
        await setNextBlockTimestamp(deadline + DEADLINE_IN);
      });

      context('buyTokens()', () => {
        it('expect to revert before deadline', async () => {
          const claimer = accounts.pop();

          await expect(
            whitelist.connect(claimer).buyTokens(),
          ).to.be.revertedWith('HEROPresale#1');
        });
      });

      context('finishPresale()', async () => {
        it('expect to finish presale', async () => {
          const summaryBefore = await token.summary();
          const controllerBalance = await getBalance(controller);
          const whitelistBalance = await getBalance(whitelist);
          const whitelistTokens = await token.balanceOf(whitelist.address);

          const tx = await whitelist.finishPresale();
          const txCost = await calcTxCost(tx);

          const summaryAfter = await token.summary();

          expect(await summaryAfter.totalSupply).to.equal(
            summaryBefore.totalSupply.sub(whitelistTokens),
          );

          expect(await summaryAfter.totalExcluded).to.equal(
            summaryBefore.totalExcluded.sub(whitelistTokens),
          );

          expect(await token.balanceOf(whitelist.address)).to.equal(0);

          expect(await getBalance(whitelist)).to.equal(0);
          expect(await getBalance(controller)).to.equal(
            controllerBalance.add(whitelistBalance).sub(txCost),
          );
        });
      });
    });
  });
});
