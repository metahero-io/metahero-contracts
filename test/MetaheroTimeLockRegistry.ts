import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import { BigNumber, BigNumberish, constants, utils } from 'ethers';
import MetaheroTokenArtifact from '../artifacts/MetaheroToken.json';
import MetaheroTimeLockRegistryArtifact from '../artifacts/MetaheroTimeLockRegistry.json';
import MetaheroTimeLockWalletArtifact from '../artifacts/MetaheroTimeLockWallet.json';
import { MetaheroTimeLockRegistry, MetaheroToken } from '../typings';
import { Signer, randomAddress, setNextBlockTimestamp } from './helpers';

const { deployContract } = waffle;
const { getSigners } = ethers;

interface TimeLock {
  amount: BigNumberish;
  deadline: number;
}

interface TimeLockConfig {
  amount: BigNumberish;
  unlockedIn: number;
}

describe('MetaheroTimeLockRegistry', () => {
  const ZERO_FEE = {
    sender: 0,
    recipient: 0,
  };
  const TOTAL_SUPPLY = 100000;

  let token: MetaheroToken;
  let registry: MetaheroTimeLockRegistry;
  let owner: Signer;
  let controller: Signer;
  let signers: Signer[];

  before(async () => {
    [owner, controller, ...signers] = await getSigners();
  });

  const computeClaimerWallet = (claimer: string) => {
    const salt = utils.solidityKeccak256(['address'], [claimer]);
    const creationCode = utils.solidityKeccak256(
      ['bytes'],
      [
        `${MetaheroTimeLockWalletArtifact.bytecode}${'0'.repeat(
          24,
        )}${token.address.toLowerCase().slice(2)}`,
      ],
    );

    return utils.getCreate2Address(registry.address, salt, creationCode);
  };

  const prepareBalances = async (
    spender: Signer,
    claimer: string,
    amount: BigNumberish,
    excludeWallet = true,
  ) => {
    await token.connect(controller).mintTo(spender.address, amount);

    await token.connect(spender).approve(registry.address, amount);

    if (excludeWallet) {
      await token.excludeAccount(computeClaimerWallet(claimer), true, true);
    }
  };

  const createTimeLocks = async (
    spender: Signer,
    claimer: string,
    timeLockConfigs: TimeLockConfig[],
  ) => {
    const result: TimeLock[] = [];

    const amount = timeLockConfigs.reduce(
      (result, { amount }) => result.add(amount),
      BigNumber.from(0),
    );

    await prepareBalances(spender, claimer, amount, true);

    for (const { amount, unlockedIn } of timeLockConfigs) {
      const timestamp = await setNextBlockTimestamp();

      await registry.connect(spender).lockTokensTo(claimer, amount, unlockedIn);

      result.push({
        amount,
        deadline: timestamp + unlockedIn,
      });
    }

    return result;
  };

  const createBeforeHook = (
    options: {
      initialize?: boolean;
      postBefore?: () => Promise<void>;
    } = {},
  ) => {
    const { initialize, postBefore } = {
      initialize: true,
      ...options,
    };

    before(async () => {
      token = (await deployContract(
        owner,
        MetaheroTokenArtifact,
      )) as MetaheroToken;

      registry = (await deployContract(
        owner,
        MetaheroTimeLockRegistryArtifact,
      )) as MetaheroTimeLockRegistry;

      if (initialize) {
        await registry.initialize(token.address);

        await token.initialize(
          {
            sender: 10,
            recipient: 10,
          },
          ZERO_FEE,
          ZERO_FEE,
          0,
          constants.AddressZero,
          controller.address,
          TOTAL_SUPPLY,
          [],
        );

        await token.setPresaleAsFinished();
      }

      if (postBefore) {
        await postBefore();
      }
    });
  };

  context('# before initialization', () => {
    createBeforeHook({
      initialize: false,
    });

    context('initialize()', () => {
      it('expect to revert when sender is not the initializer', async () => {
        const signer = signers.pop();

        await expect(
          registry.connect(signer).initialize(randomAddress()),
        ).to.be.revertedWith('Initializable#2');
      });

      it('expect to revert when token is the zero address', async () => {
        await expect(
          registry.initialize(constants.AddressZero),
        ).to.be.revertedWith('MetaheroTimeLockRegistry#1');
      });

      it('expect to initialize the contract', async () => {
        expect(await registry.initialize(token.address))
          .to.be.emit(registry, 'Initialized')
          .withArgs(token.address);
      });
    });
  });

  context('# after initialization', () => {
    createBeforeHook();

    context('token()', () => {
      it('expect to return correct token address', async () => {
        expect(await registry.token()).to.equal(token.address);
      });
    });

    context('initialize()', () => {
      it('expect to revert when contract is initialized', async () => {
        await expect(registry.initialize(randomAddress())).to.be.revertedWith(
          'Initializable#1',
        );
      });
    });

    context('createClaimerWallet()', () => {
      const claimer = randomAddress();

      it('expect to revert when claimer is the zero address', async () => {
        await expect(
          registry.createClaimerWallet(constants.AddressZero),
        ).to.be.revertedWith('MetaheroTimeLockRegistry#2');
      });

      it('expect to create claimer wallet', async () => {
        expect(await registry.createClaimerWallet(claimer))
          .to.be.emit(registry, 'ClaimerWalletCreated')
          .withArgs(claimer, computeClaimerWallet(claimer));
      });

      it('expect to revert when claimer wallet is already created', async () => {
        await expect(registry.createClaimerWallet(claimer)).to.be.revertedWith(
          'MetaheroTimeLockRegistry#3',
        );
      });
    });

    context('lockTokensTo()', () => {
      createBeforeHook();

      it('expect to revert when claimer is the zero address', async () => {
        await expect(
          registry.lockTokensTo(constants.AddressZero, 0, 0),
        ).to.be.revertedWith('MetaheroTimeLockRegistry#4');
      });

      it('expect to revert when amount is zero', async () => {
        await expect(
          registry.lockTokensTo(randomAddress(), 0, 0),
        ).to.be.revertedWith('MetaheroTimeLockRegistry#5');
      });

      it("expect to revert locked amount doesn't match transferred amount", async () => {
        const signer = signers.pop();
        const amount = 1000;

        await token.connect(signer).approve(registry.address, amount);

        await token.connect(controller).mintTo(signer.address, amount * 2);

        await expect(
          registry.connect(signer).lockTokensTo(randomAddress(), amount, 0),
        ).to.be.revertedWith('MetaheroTimeLockRegistry#6');
      });

      it('expect to lock tokens to fresh account', async () => {
        const claimer = randomAddress();
        const claimerWallet = computeClaimerWallet(claimer);
        const signer = signers.pop();
        const amount = 1000;
        const unlockedIn = 1;

        await prepareBalances(signer, claimer, amount, true);

        const timestamp = await setNextBlockTimestamp();

        const tx = await registry
          .connect(signer)
          .lockTokensTo(claimer, amount, unlockedIn);

        expect(tx)
          .to.emit(registry, 'TokensLocked')
          .withArgs(
            signer.address,
            claimer,
            claimerWallet,
            amount,
            timestamp + unlockedIn,
          );

        expect(tx)
          .to.emit(registry, 'ClaimerWalletCreated')
          .withArgs(claimer, claimerWallet);
      });
    });

    context('lockTokens()', () => {
      let claimer: Signer;
      let claimerWallet: string;

      createBeforeHook({
        postBefore: async () => {
          claimer = signers.pop();

          claimerWallet = computeClaimerWallet(claimer.address);

          await registry.createClaimerWallet(claimer.address);
        },
      });

      it('expect to lock tokens to existing account', async () => {
        const amount = 200;
        const unlockedIn = 2;

        await prepareBalances(claimer, claimer.address, amount, true);

        const timestamp = await setNextBlockTimestamp();

        const tx = await registry
          .connect(claimer)
          .lockTokens(amount, unlockedIn);

        expect(tx)
          .to.emit(registry, 'TokensLocked')
          .withArgs(
            claimer.address,
            claimer.address,
            claimerWallet,
            amount,
            timestamp + unlockedIn,
          );
        expect(tx).not.to.emit(registry, 'ClaimerWalletCreated');
      });
    });

    context('claimTokens()', () => {
      let spender: Signer;
      let claimer: Signer;
      let timeLocks: TimeLock[];

      createBeforeHook({
        postBefore: async () => {
          spender = signers.pop();
          claimer = signers.pop();

          timeLocks = await createTimeLocks(spender, claimer.address, [
            {
              amount: 1000,
              unlockedIn: 10,
            },
            {
              amount: 2000,
              unlockedIn: 20,
            },
            {
              amount: 3000,
              unlockedIn: 30,
            },
          ]);
        },
      });

      it('expect to revert before first deadline', async () => {
        await expect(
          registry.connect(claimer).claimTokens(),
        ).to.be.revertedWith('MetaheroTimeLockRegistry#9');
      });

      it('expect to revert on invalid recipient balance after transfer', async () => {
        await token.excludeAccount(
          computeClaimerWallet(claimer.address),
          false,
          false,
        );

        const { deadline } = timeLocks[0];

        await setNextBlockTimestamp(deadline);

        await expect(
          registry.connect(claimer).claimTokens(),
        ).to.be.revertedWith('MetaheroTimeLockRegistry#11');
      });

      it('expect to claim tokens from #1 time lock', async () => {
        await token.excludeAccount(
          computeClaimerWallet(claimer.address),
          true,
          true,
        );

        const { amount, deadline } = timeLocks[0];

        const expectedClaimerBalance = (
          await token.balanceOf(claimer.address)
        ).add(amount);

        const tx = await registry.connect(claimer).claimTokens();

        expect(tx)
          .emit(registry, 'TokensUnlocked')
          .withArgs(
            spender.address,
            claimer.address,
            computeClaimerWallet(claimer.address),
            claimer.address,
            amount,
            deadline,
          );

        expect(await token.balanceOf(claimer.address)).to.equal(
          expectedClaimerBalance,
        );
      });

      it('expect to claim tokens from #2 and #3 time locks', async () => {
        const { amount: amount1, deadline: deadline1 } = timeLocks[1];
        const { amount: amount2, deadline: deadline2 } = timeLocks[2];

        await setNextBlockTimestamp(deadline2);

        const expectedClaimerBalance = (await token.balanceOf(claimer.address))
          .add(amount1)
          .add(amount2);

        const tx = await registry.connect(claimer).claimTokens();

        expect(tx)
          .emit(registry, 'TokensUnlocked')
          .withArgs(
            spender.address,
            claimer.address,
            computeClaimerWallet(claimer.address),
            claimer.address,
            amount1,
            deadline1,
          );

        expect(tx)
          .emit(registry, 'TokensUnlocked')
          .withArgs(
            spender.address,
            claimer.address,
            computeClaimerWallet(claimer.address),
            claimer.address,
            amount2,
            deadline2,
          );

        expect(await token.balanceOf(claimer.address)).to.equal(
          expectedClaimerBalance,
        );
      });
    });

    context('claimTokensTo()', () => {
      let claimer: Signer;

      createBeforeHook({
        postBefore: async () => {
          claimer = signers.pop();
          await registry.createClaimerWallet(claimer.address);
        },
      });

      it("expect to revert when claimer wallet doesn't exist", async () => {
        const signer = signers.pop();

        await expect(
          registry.connect(signer).claimTokensTo(randomAddress()),
        ).to.be.revertedWith('MetaheroTimeLockRegistry#7');
      });

      it('expect to revert when recipient is the zero address', async () => {
        await expect(
          registry.connect(claimer).claimTokensTo(constants.AddressZero),
        ).to.be.revertedWith('MetaheroTimeLockRegistry#8');
      });

      it('expect to revert on no time locks', async () => {
        await expect(
          registry.connect(claimer).claimTokensTo(randomAddress()),
        ).to.be.revertedWith('MetaheroTimeLockRegistry#9');
      });
    });

    context('computeClaimerWallet()', () => {
      let claimer: Signer;

      createBeforeHook({
        postBefore: async () => {
          claimer = signers.pop();
          await registry.createClaimerWallet(claimer.address);
        },
      });

      it('expect to return zero address when claimer is the zero address', async () => {
        expect(
          await registry.computeClaimerWallet(constants.AddressZero),
        ).to.equal(constants.AddressZero);
      });

      it('expect to return created address', async () => {
        expect(await registry.computeClaimerWallet(claimer.address)).to.equal(
          computeClaimerWallet(claimer.address),
        );
      });

      it('expect to return fresh address', async () => {
        const claimer = randomAddress();

        expect(await registry.computeClaimerWallet(claimer)).to.equal(
          computeClaimerWallet(claimer),
        );
      });
    });

    context('getClaimerTimeLocks()', () => {
      const amount1 = 300;
      const amount2 = 500;
      const claimer = randomAddress();
      let spender: Signer;
      let deadline1: number;
      let deadline2: number;

      createBeforeHook({
        postBefore: async () => {
          spender = signers.pop();

          await prepareBalances(spender, claimer, amount1 + amount2, true);

          {
            const unlockedIn = 1000;
            const timestamp = await setNextBlockTimestamp();
            await registry
              .connect(spender)
              .lockTokensTo(claimer, amount1, unlockedIn);
            deadline1 = timestamp + unlockedIn;
          }

          {
            const unlockedIn = 200;
            const timestamp = await setNextBlockTimestamp();
            await registry
              .connect(spender)
              .lockTokensTo(claimer, amount2, unlockedIn);
            deadline2 = timestamp + unlockedIn;
          }
        },
      });

      it('expect to return empty array for not existing claimer', async () => {
        expect(await registry.getClaimerTimeLocks(randomAddress())).to.empty;
      });

      it('expect to return claimer time locks', async () => {
        const output = await registry.getClaimerTimeLocks(claimer);

        expect(output[0].spender).to.equal(spender.address);
        expect(output[0].amount).to.equal(amount1);
        expect(output[0].deadline).to.equal(deadline1);

        expect(output[1].spender).to.equal(spender.address);
        expect(output[1].amount).to.equal(amount2);
        expect(output[1].deadline).to.equal(deadline2);
      });
    });
  });
});
