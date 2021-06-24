import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import { BigNumber, constants } from 'ethers';
import HEROTokenArtifact from '../../artifacts/HEROToken.json';
import HEROPresaleArtifact from '../../artifacts/HEROPresale.json';
import { HEROToken, HEROPresale } from '../../typings';
import {
  Signer,
  setNextBlockTimestamp,
  getBalance,
  calcTxCost,
  randomAddress,
} from '../helpers';

const { deployContract } = waffle;
const { getSigners } = ethers;

describe('HEROPresale', () => {
  const TOKENS_AMOUNT_PER_NATIVE = BigNumber.from(10);
  const MAX_PURCHASE_PRICE = BigNumber.from(10000000);
  const TOTAL_SUPPLY = BigNumber.from(100000000);
  const TOTAL_TOKENS = BigNumber.from(1000000);
  const DEADLINE_IN = 60; // 60 sec

  let token: HEROToken;
  let presale: HEROPresale;
  let owner: Signer;
  let external: Signer;
  let accounts: Signer[];
  let totalTokens = BigNumber.from(0);
  let deadline: number;

  const createBeforeHook = (
    options: {
      initialize?: boolean;
      transferTokens?: boolean;
      addAccounts?: boolean;
      deadlineIn?: number;
    } = {},
  ) => {
    const {
      initialize, //
      transferTokens,
      addAccounts,
      deadlineIn,
    } = {
      initialize: false,
      transferTokens: false,
      addAccounts: false,
      deadlineIn: DEADLINE_IN,
      ...options,
    };

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
        fee,
        0,
        constants.AddressZero,
        constants.AddressZero,
        TOTAL_SUPPLY,
        [presale.address, ...accounts.map(({ address }) => address)],
      );

      if (transferTokens) {
        await token.transfer(presale.address, TOTAL_TOKENS);

        totalTokens = TOTAL_TOKENS;
      }

      if (initialize) {
        deadline = (await setNextBlockTimestamp()) + DEADLINE_IN;

        await presale.initialize(
          token.address,
          TOKENS_AMOUNT_PER_NATIVE,
          MAX_PURCHASE_PRICE,
          deadlineIn,
        );

        if (addAccounts) {
          await presale.addAccounts(accounts.map(({ address }) => address));
        }
      }
    });
  };

  context('# before initialization', () => {
    createBeforeHook({
      initialize: false,
    });

    context('initialize()', () => {
      it('expect to revert when sender is not the initializer', async () => {
        await expect(
          presale
            .connect(external)
            .initialize(
              token.address,
              TOKENS_AMOUNT_PER_NATIVE,
              MAX_PURCHASE_PRICE,
              DEADLINE_IN,
            ),
        ).to.be.revertedWith('Initializable#2');
      });

      it('expect to revert when token is the zero address', async () => {
        await expect(
          presale.initialize(
            constants.AddressZero,
            TOKENS_AMOUNT_PER_NATIVE,
            MAX_PURCHASE_PRICE,
            DEADLINE_IN,
          ),
        ).to.be.revertedWith('HEROPresale#6');
      });

      it('expect to initialize the contract', async () => {
        const tx = await presale.initialize(
          token.address,
          TOKENS_AMOUNT_PER_NATIVE,
          MAX_PURCHASE_PRICE,
          DEADLINE_IN,
        );

        expect(tx).to.emit(presale, 'Initialized');
      });

      it('expect to revert when whitelist is initialized', async () => {
        await expect(
          presale.initialize(
            token.address,
            TOKENS_AMOUNT_PER_NATIVE,
            MAX_PURCHASE_PRICE,
            DEADLINE_IN,
          ),
        ).to.be.revertedWith('Initializable#1');
      });
    });
  });

  context('# after initialization', () => {
    createBeforeHook({
      initialize: true,
      transferTokens: true,
      addAccounts: true,
    });

    context('token()', () => {
      it('expect to return correct token', async () => {
        expect(await presale.token()).to.equal(token.address);
      });
    });

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
        expect(await presale.deadline()).to.equal(deadline);
      });
    });

    context('whitelist()', () => {
      it('expect to return true when account is on the whitelist', async () => {
        expect(await presale.whitelist(accounts[0].address)).to.be.true;
      });

      it('expect to return false when account is not on the whitelist', async () => {
        expect(await presale.whitelist(randomAddress())).to.be.false;
      });
    });

    context('updateSettings()', () => {
      it('expect to revert when sender is not the owner', async () => {
        await expect(
          presale
            .connect(external)
            .updateSettings(TOKENS_AMOUNT_PER_NATIVE, MAX_PURCHASE_PRICE),
        ).to.be.revertedWith('Owned#1');
      });

      it('expect to revert when tokens amount per native is zero', async () => {
        await expect(
          presale.updateSettings(0, MAX_PURCHASE_PRICE),
        ).to.be.revertedWith('HEROPresale#10');
      });

      it('expect to revert when max purchase price is zero', async () => {
        await expect(
          presale.updateSettings(TOKENS_AMOUNT_PER_NATIVE, 0),
        ).to.be.revertedWith('HEROPresale#11');
      });

      it('expect to update settings', async () => {
        const tx = await presale.updateSettings(
          TOKENS_AMOUNT_PER_NATIVE,
          MAX_PURCHASE_PRICE,
        );

        expect(tx)
          .to.emit(presale, 'SettingsUpdated')
          .withArgs(TOKENS_AMOUNT_PER_NATIVE, MAX_PURCHASE_PRICE);
      });
    });

    context('updateDeadline()', () => {
      it('expect to revert when sender is not the owner', async () => {
        await expect(
          presale.connect(external).updateDeadline(1),
        ).to.be.revertedWith('Owned#1');
      });

      it('expect to update deadline', async () => {
        deadline = (await setNextBlockTimestamp()) + DEADLINE_IN;

        const tx = await presale.updateDeadline(DEADLINE_IN);

        expect(tx).to.emit(presale, 'DeadlineUpdated').withArgs(deadline);
      });
    });

    context('syncTotalTokens()', () => {
      const newTokens = 1000;

      before(async () => {
        await token.transfer(presale.address, newTokens);
        totalTokens = totalTokens.add(newTokens);
      });

      it('expect to sync total tokens', async () => {
        await presale.syncTotalTokens();

        expect((await presale.summary()).totalTokens).to.equal(totalTokens);
      });
    });

    context('addAccounts()', () => {
      it('expect to revert when sender is not the owner', async () => {
        await expect(
          presale.connect(external).addAccounts([randomAddress()]),
        ).to.be.revertedWith('Owned#1');
      });

      it('expect to revert when one of the account is zero address', async () => {
        await expect(
          presale.addAccounts([randomAddress(), constants.AddressZero]),
        ).to.be.revertedWith('HEROPresale#12');
      });

      it('expect to revert when there is no accounts to add', async () => {
        await expect(presale.addAccounts([])).to.be.revertedWith(
          'HEROPresale#13',
        );
      });

      it('expect to omit existing account', async () => {
        const { totalAccounts } = await presale.summary();
        const newAccounts = [
          randomAddress(), //
          randomAddress(),
        ];
        const existingAccount = accounts[0].address;

        const tx = await presale.addAccounts([...newAccounts, existingAccount]);

        for (const account of newAccounts) {
          expect(tx).to.emit(presale, 'AccountAdded').withArgs(account);
        }

        expect((await presale.summary()).totalAccounts).to.equal(
          totalAccounts.add(newAccounts.length),
        );
      });

      it('expect to add accounts to the whitelist', async () => {
        const newAccounts = [
          randomAddress(), //
          randomAddress(),
          randomAddress(),
        ];

        const tx = await presale.addAccounts(newAccounts);

        for (const account of newAccounts) {
          expect(tx).to.emit(presale, 'AccountAdded').withArgs(account);
        }
      });
    });

    context('removeAccounts()', () => {
      const existingAccounts = [
        randomAddress(), //
        randomAddress(),
        randomAddress(),
        randomAddress(),
      ];

      before(async () => {
        await presale.addAccounts(existingAccounts);
      });

      it('expect to revert when sender is not the owner', async () => {
        await expect(
          presale.connect(external).removeAccounts([randomAddress()]),
        ).to.be.revertedWith('Owned#1');
      });

      it('expect to revert when one of the account is zero address', async () => {
        await expect(
          presale.removeAccounts([randomAddress(), constants.AddressZero]),
        ).to.be.revertedWith('HEROPresale#7');
      });

      it('expect to revert when there is no accounts to remove', async () => {
        await expect(presale.removeAccounts([])).to.be.revertedWith(
          'HEROPresale#8',
        );
      });

      it('expect to omit not existing account', async () => {
        const oldAccounts = existingAccounts.slice(0, 2);

        const { totalAccounts } = await presale.summary();

        const randomAccount = randomAddress();

        const tx = await presale.removeAccounts([
          ...oldAccounts,
          randomAccount,
        ]);

        for (const account of oldAccounts) {
          expect(tx).to.emit(presale, 'AccountRemoved').withArgs(account);
        }

        expect((await presale.summary()).totalAccounts).to.equal(
          totalAccounts.sub(oldAccounts.length),
        );
      });

      it('expect to remove accounts from the whitelist', async () => {
        const oldAccounts = existingAccounts.slice(2);

        const tx = await presale.removeAccounts(oldAccounts);

        for (const account of oldAccounts) {
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

        it('expect to revert on zero msg.value', async () => {
          await expect(
            account.sendTransaction({
              to: presale.address,
              value: 0,
            }),
          ).to.be.revertedWith('HEROPresale#3');
        });

        it('expect to revert when msg.value is too high', async () => {
          await expect(
            account.sendTransaction({
              to: presale.address,
              value: MAX_PURCHASE_PRICE.add(1),
            }),
          ).to.be.revertedWith('HEROPresale#4');
        });

        it('expect to revert when purchased tokens amount is too high', async () => {
          await expect(
            account.sendTransaction({
              to: presale.address,
              value: MAX_PURCHASE_PRICE,
            }),
          ).to.be.revertedWith('HEROPresale#5');
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

        context('# when all tokens are sold', () => {
          createBeforeHook({
            initialize: true,
            transferTokens: false,
            deadlineIn: 0,
          });

          it('expect to finish presale', async () => {
            const totalSupply = await token.totalSupply();

            await presale.finishPresale();

            expect(await token.totalSupply()).to.equal(totalSupply);
          });
        });
      });
    });
  });
});
