import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import { BigNumber, constants } from 'ethers';
import MetaheroTokenArtifact from '../artifacts/MetaheroToken.json';
import MetaheroPresaleArtifact from '../artifacts/MetaheroPresale.json';
import { MetaheroToken, MetaheroPresale } from '../typings';
import { Signer, getBalance, calcTxCost, randomAddress } from './helpers';

const { deployContract } = waffle;
const { getSigners } = ethers;

describe('MetaheroPresale', () => {
  const TOKENS_AMOUNT_PER_NATIVE = BigNumber.from(10);
  const MAX_PURCHASE_PRICE = BigNumber.from(10000000);
  const TOTAL_SUPPLY = BigNumber.from(100000000);
  const TOTAL_TOKENS = BigNumber.from(1000000);

  let token: MetaheroToken;
  let presale: MetaheroPresale;
  let owner: Signer;
  let external: Signer;
  let accounts: Signer[];
  let totalTokens = BigNumber.from(0);

  const createBeforeHook = (
    options: {
      initialize?: boolean;
      transferTokens?: boolean;
      addAccounts?: boolean;
    } = {},
  ) => {
    const {
      initialize, //
      transferTokens,
      addAccounts,
    } = {
      initialize: false,
      transferTokens: false,
      addAccounts: false,
      ...options,
    };

    before(async () => {
      [owner, external, ...accounts] = await getSigners();

      token = (await deployContract(
        owner,
        MetaheroTokenArtifact,
      )) as MetaheroToken;

      presale = (await deployContract(
        owner,
        MetaheroPresaleArtifact,
      )) as MetaheroPresale;

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
        await presale.initialize(
          token.address,
          TOKENS_AMOUNT_PER_NATIVE,
          MAX_PURCHASE_PRICE,
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
            ),
        ).to.be.revertedWith('Initializable#2');
      });

      it('expect to revert when token is the zero address', async () => {
        await expect(
          presale.initialize(
            constants.AddressZero,
            TOKENS_AMOUNT_PER_NATIVE,
            MAX_PURCHASE_PRICE,
          ),
        ).to.be.revertedWith('MetaheroPresale#6');
      });

      it('expect to initialize the contract', async () => {
        const tx = await presale.initialize(
          token.address,
          TOKENS_AMOUNT_PER_NATIVE,
          MAX_PURCHASE_PRICE,
        );

        expect(tx).to.emit(presale, 'Initialized');
      });

      it('expect to revert when the contract is initialized', async () => {
        await expect(
          presale.initialize(
            token.address,
            TOKENS_AMOUNT_PER_NATIVE,
            MAX_PURCHASE_PRICE,
          ),
        ).to.be.revertedWith('Initializable#1');
      });
    });
  });

  context('# after initialized', () => {
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

    context('started()', () => {
      it('expect to return correct started value', async () => {
        expect(await presale.started()).to.be.false;
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
        ).to.be.revertedWith('MetaheroPresale#12');
      });

      it('expect to revert when there is no accounts to add', async () => {
        await expect(presale.addAccounts([])).to.be.revertedWith(
          'MetaheroPresale#13',
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
        ).to.be.revertedWith('MetaheroPresale#7');
      });

      it('expect to revert when there is no accounts to remove', async () => {
        await expect(presale.removeAccounts([])).to.be.revertedWith(
          'MetaheroPresale#8',
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

    context('# before started', () => {
      context('buy tokens', () => {
        let account: Signer;

        before(() => {
          account = accounts.pop();
        });

        it('expect to revert when presale has not started', async () => {
          await expect(
            external.sendTransaction({
              to: presale.address,
              value: 1,
            }),
          ).to.be.revertedWith('MetaheroPresale#1');
        });
      });
    });

    context('# after start', () => {
      context('buy tokens', () => {
        let account: Signer;

        before(async () => {
          account = accounts.pop();
          await presale.start();
        });

        it('expect to revert on zero msg.value', async () => {
          await expect(
            account.sendTransaction({
              to: presale.address,
              value: 0,
            }),
          ).to.be.revertedWith('MetaheroPresale#3');
        });

        it('expect to revert when msg.value is too high', async () => {
          await expect(
            account.sendTransaction({
              to: presale.address,
              value: MAX_PURCHASE_PRICE.add(1),
            }),
          ).to.be.revertedWith('MetaheroPresale#4');
        });

        it('expect to revert when purchased tokens amount is too high', async () => {
          await expect(
            account.sendTransaction({
              to: presale.address,
              value: MAX_PURCHASE_PRICE,
            }),
          ).to.be.revertedWith('MetaheroPresale#5');
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

        context('finish()', async () => {
          it('expect to finish presale', async () => {
            const summaryBefore = await token.summary();
            const ownerBalance = await getBalance(owner);
            const presaleBalance = await getBalance(presale);
            const presaleTokens = await token.balanceOf(presale.address);

            const tx = await presale.finish();
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
            });

            it('expect to finish presale', async () => {
              const totalSupply = await token.totalSupply();

              await presale.finish();

              expect(await token.totalSupply()).to.equal(totalSupply);
            });
          });
        });
      });
    });
  });
});
