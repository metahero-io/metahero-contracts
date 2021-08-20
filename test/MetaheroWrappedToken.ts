import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import { constants } from 'ethers';
import MetaheroTokenArtifact from '../artifacts/MetaheroToken.json';
import MetaheroWrappedTokenArtifact from '../artifacts/MetaheroWrappedToken.json';
import { MetaheroToken, MetaheroWrappedToken } from '../typings';
import { randomAddress, Signer } from './helpers';

const { deployContract } = waffle;
const { getSigners } = ethers;

describe('MetaheroWrappedToken', () => {
  const ZERO_FEE = {
    sender: 0,
    recipient: 0,
  };

  let owner: Signer;
  let token: MetaheroToken;
  let signers: Signer[];
  let wrappedToken: MetaheroWrappedToken;

  before(async () => {
    [owner, ...signers] = await getSigners();
  });

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
      wrappedToken = (await deployContract(
        owner,
        MetaheroWrappedTokenArtifact,
      )) as MetaheroWrappedToken;

      token = (await deployContract(
        owner,
        MetaheroTokenArtifact,
      )) as MetaheroToken;

      if (initialize) {
        await token.initialize(
          ZERO_FEE,
          ZERO_FEE,
          ZERO_FEE,
          0,
          constants.AddressZero,
          constants.AddressZero,
          constants.MaxUint256,
          [],
        );

        await wrappedToken.initialize(token.address);

        await token.setPresaleAsFinished();
        await token.excludeAccount(wrappedToken.address, true, true);
      }

      if (postBefore) {
        await postBefore();
      }
    });
  };

  context('initialize()', () => {
    createBeforeHook({
      initialize: false,
    });

    it('expect to revert on zero token', async () => {
      await expect(
        wrappedToken.initialize(constants.AddressZero),
      ).to.be.revertedWith('MetaheroWrappedToken#1');
    });

    it('expect to initialize the contract', async () => {
      expect(await wrappedToken.token()).to.equal(constants.AddressZero);

      await wrappedToken.initialize(token.address);

      expect(await wrappedToken.token()).to.equal(token.address);
    });

    it('expect to return correct token', async () => {
      expect(await wrappedToken.token()).to.equal(token.address);
    });
  });

  context('deposit()', () => {
    const amount = 100;
    let sender: Signer;

    createBeforeHook({
      postBefore: async () => {
        sender = signers.pop();

        await token.transfer(sender.address, amount);

        await token.connect(sender).approve(wrappedToken.address, amount);
      },
    });

    it('expect to revert when amount is zero', async () => {
      await expect(wrappedToken.deposit(0)).to.be.revertedWith(
        'MetaheroWrappedToken#9',
      );
    });

    it('expect to deposit', async () => {
      const tx = await wrappedToken.connect(sender).deposit(amount);

      expect(tx)
        .to.emit(token, 'Transfer')
        .withArgs(sender.address, wrappedToken.address, amount);

      expect(tx)
        .to.emit(wrappedToken, 'Transfer')
        .withArgs(constants.AddressZero, sender.address, amount);

      expect(await token.balanceOf(sender.address)).to.equal(0);
      expect(await wrappedToken.balanceOf(sender.address)).to.equal(amount);
    });
  });

  context('depositTo()', () => {
    const recipient = randomAddress();
    const amount = 100;
    let sender: Signer;

    createBeforeHook({
      postBefore: async () => {
        sender = signers.pop();

        await token.transfer(sender.address, amount);

        await token.connect(sender).approve(wrappedToken.address, amount);
      },
    });

    it('expect to revert when recipient is the zero address', async () => {
      await expect(
        wrappedToken.depositTo(constants.AddressZero, 10),
      ).to.be.revertedWith('MetaheroWrappedToken#8');
    });

    it('expect to deposit to recipient', async () => {
      const tx = await wrappedToken
        .connect(sender)
        .depositTo(recipient, amount);

      expect(tx)
        .to.emit(token, 'Transfer')
        .withArgs(sender.address, wrappedToken.address, amount);

      expect(tx)
        .to.emit(wrappedToken, 'Transfer')
        .withArgs(constants.AddressZero, recipient, amount);

      expect(await token.balanceOf(recipient)).to.equal(0);
      expect(await wrappedToken.balanceOf(recipient)).to.equal(amount);
    });
  });

  context('withdraw()', () => {
    const amount = 100;
    let sender: Signer;

    createBeforeHook({
      postBefore: async () => {
        sender = signers.pop();

        await token.approve(wrappedToken.address, constants.MaxUint256);

        await wrappedToken.depositTo(sender.address, amount);
      },
    });

    it('expect to revert when amount is zero', async () => {
      await expect(wrappedToken.withdraw(0)).to.be.revertedWith(
        'MetaheroWrappedToken#11',
      );
    });

    it('expect to revert when amount exceeds sender balance', async () => {
      await expect(wrappedToken.withdraw(amount + 1)).to.be.revertedWith(
        'MetaheroWrappedToken#12',
      );
    });

    it('expect to withdraw', async () => {
      const tx = await wrappedToken.connect(sender).withdraw(amount);

      expect(tx)
        .to.emit(token, 'Transfer')
        .withArgs(wrappedToken.address, sender.address, amount);

      expect(tx)
        .to.emit(wrappedToken, 'Transfer')
        .withArgs(sender.address, constants.AddressZero, amount);

      expect(await token.balanceOf(sender.address)).to.equal(amount);
      expect(await wrappedToken.balanceOf(sender.address)).to.equal(0);
    });
  });

  context('withdrawTo()', () => {
    const recipient = randomAddress();
    const amount = 100;
    let sender: Signer;

    createBeforeHook({
      postBefore: async () => {
        sender = signers.pop();

        await token.approve(wrappedToken.address, constants.MaxUint256);

        await wrappedToken.depositTo(sender.address, amount);
      },
    });

    it('expect to revert when recipient is the zero address', async () => {
      await expect(
        wrappedToken.withdrawTo(constants.AddressZero, amount),
      ).to.be.revertedWith('MetaheroWrappedToken#10');
    });

    it('expect to withdraw to recipient', async () => {
      const tx = await wrappedToken
        .connect(sender)
        .withdrawTo(recipient, amount);

      expect(tx)
        .to.emit(token, 'Transfer')
        .withArgs(wrappedToken.address, recipient, amount);

      expect(tx)
        .to.emit(wrappedToken, 'Transfer')
        .withArgs(sender.address, constants.AddressZero, amount);

      expect(await token.balanceOf(recipient)).to.equal(amount);
      expect(await wrappedToken.balanceOf(sender.address)).to.equal(0);
    });
  });

  context('# erc20 functions', () => {
    const holderBBalance = 1000000;
    let holderA: Signer;
    let holderABalance = 2000000;
    let holderB: Signer;

    createBeforeHook({
      postBefore: async () => {
        holderA = signers.pop();
        holderB = signers.pop();

        await token.approve(wrappedToken.address, constants.MaxUint256);

        await wrappedToken.depositTo(holderA.address, holderABalance);
        await wrappedToken.depositTo(holderB.address, holderBBalance);
      },
    });

    it('expect to return correct total supply', async () => {
      expect(await wrappedToken.totalSupply()).to.equal(
        holderABalance + holderBBalance,
      );
    });

    context('approve()', () => {
      it('expect to revert when spender is the zero address', async () => {
        await expect(
          wrappedToken.connect(holderA).approve(constants.AddressZero, 10),
        ).to.be.revertedWith('MetaheroWrappedToken#3');
      });

      it('expect to approve allowance', async () => {
        const spender = randomAddress();
        const allowance = 100;

        const tx = await wrappedToken
          .connect(holderA)
          .approve(spender, allowance);

        expect(tx)
          .to.emit(wrappedToken, 'Approval')
          .withArgs(holderA.address, spender, allowance);
      });
    });

    context('transfer()', () => {
      it('expect to revert when recipient is the zero address', async () => {
        await expect(
          wrappedToken.connect(holderA).transfer(constants.AddressZero, 100),
        ).to.be.revertedWith('MetaheroWrappedToken#5');
      });

      it('expect to revert when amount is zero', async () => {
        await expect(
          wrappedToken.connect(holderA).transfer(randomAddress(), 0),
        ).to.be.revertedWith('MetaheroWrappedToken#6');
      });

      it('expect to revert when sender balance is too low', async () => {
        await expect(
          wrappedToken
            .connect(holderA)
            .transfer(randomAddress(), holderABalance + 1),
        ).to.be.revertedWith('MetaheroWrappedToken#7');
      });

      it('expect to transfer', async () => {
        const recipient = randomAddress();
        const value = 100;

        const tx = await wrappedToken
          .connect(holderA)
          .transfer(recipient, value);

        expect(tx)
          .to.emit(wrappedToken, 'Transfer')
          .withArgs(holderA.address, recipient, value);

        holderABalance -= value;
      });
    });

    context('transferFrom()', () => {
      const allowance = 10;

      before(async () => {
        await wrappedToken.connect(holderA).approve(holderB.address, allowance);
      });

      it('expect to revert when amount exceeds allowance', async () => {
        await expect(
          wrappedToken
            .connect(holderB)
            .transferFrom(holderA.address, randomAddress(), allowance + 1),
        ).to.be.revertedWith('MetaheroWrappedToken#2');
      });

      it('expect to revert when sender is the zero address', async () => {
        await expect(
          wrappedToken
            .connect(holderB)
            .transferFrom(constants.AddressZero, randomAddress(), allowance),
        ).to.be.revertedWith('MetaheroWrappedToken#4');
      });

      it('expect to revert when recipient is the zero address', async () => {
        await expect(
          wrappedToken
            .connect(holderB)
            .transferFrom(holderA.address, constants.AddressZero, allowance),
        ).to.be.revertedWith('MetaheroWrappedToken#5');
      });

      it('expect to transfer from', async () => {
        const recipient = randomAddress();

        await wrappedToken
          .connect(holderB)
          .transferFrom(holderA.address, recipient, allowance);

        expect(
          await wrappedToken.allowance(holderA.address, holderB.address),
        ).to.equal(0);

        holderABalance -= allowance;

        expect(await wrappedToken.balanceOf(holderA.address)).to.equal(
          holderABalance,
        );
      });
    });

    context('allowance()', () => {
      const spender = randomAddress();
      const allowance = 20;

      before(async () => {
        await wrappedToken.connect(holderA).approve(spender, allowance);
      });

      it('expect to return correct allowance', async () => {
        expect(await wrappedToken.allowance(holderA.address, spender)).to.equal(
          allowance,
        );
      });
    });

    context('balanceOf()', () => {
      it('expect to return correct balance', async () => {
        expect(await wrappedToken.balanceOf(holderB.address)).to.equal(
          holderBBalance,
        );
      });
    });
  });
});
