import { BigNumber, BigNumberish, constants } from 'ethers';
import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import MetaheroTokenArtifact from '../../artifacts/MetaheroToken.json';
import { MetaheroToken, MetaheroLPMMock } from '../../typings';
import { randomAddress, Signer } from '../helpers';

const { deployContract } = waffle;
const { getSigners } = ethers;

interface BeforeHookOptions {
  burnFee: {
    sender: number;
    recipient: number;
  };
  controller: string;
  rewardsFee: this['burnFee'];
  minTotalSupply: BigNumberish;
  totalSupply: BigNumberish;
  transferToExclude: boolean;
  postBefore: () => Promise<void>;
}

describe('MetaheroToken', () => {
  const TOTAL_SUPPLY = BigNumber.from('10000000000000');
  const MIN_TOTAL_SUPPLY = BigNumber.from('100000000000');
  const ZERO_FEE = {
    sender: 0,
    recipient: 0,
  };

  let owner: Signer;
  let controller: Signer;
  let excluded: Signer;
  let holder: Signer;
  let token: MetaheroToken;
  let lpm: MetaheroLPMMock;

  before(async () => {
    const signers = await getSigners();

    [owner, controller, excluded, holder] = signers;
  });

  const createBeforeHook = (options: Partial<BeforeHookOptions> = {}) => {
    const {
      burnFee,
      rewardsFee,
      postBefore,
      controller: controllerAddress,
      totalSupply,
      minTotalSupply,
      transferToExclude,
    } = {
      burnFee: ZERO_FEE,
      rewardsFee: ZERO_FEE,
      totalSupply: TOTAL_SUPPLY,
      minTotalSupply: MIN_TOTAL_SUPPLY,
      transferToExclude: true,
      ...options,
    };

    before(async () => {
      token = (await deployContract(
        owner,
        MetaheroTokenArtifact,
      )) as MetaheroToken;
      lpm = null;

      let controllerParam: string;

      if (controllerAddress === null) {
        controllerParam = constants.AddressZero;
      } else if (controllerAddress) {
        controllerParam = controllerAddress;
      } else {
        controllerParam = controller.address;
      }

      await token.initialize(
        burnFee,
        ZERO_FEE,
        rewardsFee,
        minTotalSupply,
        constants.AddressZero,
        controllerParam,
        totalSupply,
        [excluded.address],
      );

      await token.finishPresale();

      if (totalSupply && transferToExclude) {
        await token.transfer(excluded.address, totalSupply);
      }
      if (postBefore) {
        await postBefore();
      }
    });
  };

  context('excludeAccount()', () => {
    createBeforeHook({
      postBefore: async () => {
        await token.connect(excluded).transfer(holder.address, 10);
      },
    });

    it('expect to revert when sender is not the owner', async () => {
      await expect(
        token.connect(holder).excludeAccount(randomAddress(), false, false),
      ).to.be.revertedWith('Owned#1');
    });

    it('expect to revert when account is the zero address', async () => {
      await expect(
        token.excludeAccount(constants.AddressZero, false, false),
      ).to.be.revertedWith('MetaheroToken#7');
    });

    it('expect to revert when account already exist', async () => {
      await expect(
        token.excludeAccount(excluded.address, false, false),
      ).to.be.revertedWith('MetaheroToken#8');
    });

    it('expect to revert when account is the holder', async () => {
      await expect(
        token.excludeAccount(holder.address, false, false),
      ).to.be.revertedWith('MetaheroToken#9');
    });

    it('expect to exclude fresh account', async () => {
      const account = randomAddress();
      const tx = await token.excludeAccount(account, false, false);

      expect(tx)
        .to.emit(token, 'AccountExcluded')
        .withArgs(account, false, false);
    });

    it('expect to update excluded account', async () => {
      const tx = await token.excludeAccount(excluded.address, true, false);

      expect(tx)
        .to.emit(token, 'AccountExcluded')
        .withArgs(excluded.address, true, false);
    });
  });

  context('approve()', () => {
    createBeforeHook();

    it('expect to revert when spender is the zero address', async () => {
      await expect(
        token.connect(holder).approve(constants.AddressZero, 10),
      ).to.be.revertedWith('MetaheroToken#11');
    });

    it('expect to approve allowance', async () => {
      const spender = randomAddress();
      const allowance = 100;

      const tx = await token.connect(holder).approve(spender, allowance);
      expect(tx)
        .to.emit(token, 'Approval')
        .withArgs(holder.address, spender, allowance);
    });
  });

  context('mintTo()', () => {
    createBeforeHook();

    it('expect to revert when sender is not the controller', async () => {
      await expect(token.mintTo(randomAddress(), 10)).to.be.revertedWith(
        'Controlled#1',
      );
    });

    it('expect to revert when account is the zero address', async () => {
      await expect(
        token.connect(controller).mintTo(constants.AddressZero, 10),
      ).to.be.revertedWith('MetaheroToken#12');
    });

    it('expect to revert when amount is zero', async () => {
      await expect(
        token.connect(controller).mintTo(excluded.address, 0),
      ).to.be.revertedWith('MetaheroToken#13');
    });

    it('expect to mint tokens to holder', async () => {
      const account = holder.address;
      const amount = 200;

      const tx = await token.connect(controller).mintTo(account, amount);

      expect(tx)
        .to.emit(token, 'Transfer')
        .withArgs(constants.AddressZero, account, amount);
    });

    it('expect to mint tokens to excluded', async () => {
      const account = excluded.address;
      const amount = 100;

      const tx = await token.connect(controller).mintTo(account, amount);

      expect(tx)
        .to.emit(token, 'Transfer')
        .withArgs(constants.AddressZero, account, amount);
    });
  });

  context('burn()', () => {
    createBeforeHook();

    it('expect to revert when sender is not excluded', async () => {
      await expect(token.connect(holder).burn(10)).to.be.revertedWith(
        'MetaheroToken#2',
      );
    });

    it('expect to revert when amount is zero', async () => {
      await expect(token.connect(excluded).burn(0)).to.be.revertedWith(
        'MetaheroToken#15',
      );
    });

    it('expect to revert when amount too height', async () => {
      await expect(
        token.connect(excluded).burn(TOTAL_SUPPLY.add(1)),
      ).to.be.revertedWith('MetaheroToken#16');
    });

    it('expect to revert when total supply is too low', async () => {
      await expect(
        token.connect(excluded).burn(TOTAL_SUPPLY.sub(100)),
      ).to.be.revertedWith('MetaheroToken#17');
    });

    it('expect to burn tokens', async () => {
      const amount = 100;

      const tx = await token.connect(excluded).burn(amount);

      expect(tx)
        .to.emit(token, 'Transfer')
        .withArgs(excluded.address, constants.AddressZero, amount);
    });
  });

  context('burnFrom()', () => {
    createBeforeHook({
      postBefore: async () => {
        await token.connect(excluded).transfer(holder.address, 10000);
      },
    });

    it('expect to revert when sender is not the controller', async () => {
      await expect(token.burnFrom(randomAddress(), 10)).to.be.revertedWith(
        'Controlled#1',
      );
    });

    it('expect to revert when account is the zero address', async () => {
      await expect(
        token.connect(controller).burnFrom(constants.AddressZero, 10),
      ).to.be.revertedWith('MetaheroToken#14');
    });

    it('expect to revert when amount is zero', async () => {
      await expect(
        token.connect(controller).burnFrom(excluded.address, 0),
      ).to.be.revertedWith('MetaheroToken#15');
    });

    it('expect to burn holder tokens', async () => {
      const account = holder.address;
      const amount = 200;

      const tx = await token.connect(controller).burnFrom(account, amount);

      expect(tx)
        .to.emit(token, 'Transfer')
        .withArgs(account, constants.AddressZero, amount);
    });

    it('expect to burn excluded tokens', async () => {
      const account = excluded.address;
      const amount = 100;

      const tx = await token.connect(controller).burnFrom(account, amount);

      expect(tx)
        .to.emit(token, 'Transfer')
        .withArgs(account, constants.AddressZero, amount);
    });
  });

  context('allowance()', () => {
    const spender = randomAddress();
    const allowance = 100;

    createBeforeHook({
      postBefore: async () => {
        await token.connect(holder).approve(spender, allowance);
      },
    });

    it('expect to return correct allowances', async () => {
      expect(await token.allowance(randomAddress(), randomAddress())).to.equal(
        0,
      );
      expect(await token.allowance(holder.address, spender)).to.equal(
        allowance,
      );
    });
  });

  context('getBalanceSummary()', () => {
    const transferAmount = 100000;
    const recipientFee = 5;

    createBeforeHook({
      rewardsFee: {
        sender: 0,
        recipient: recipientFee,
      },
      postBefore: async () => {
        await token.connect(excluded).transfer(holder.address, transferAmount);
      },
    });

    it('expect to return correct balance summary', async () => {
      const output = await token.getBalanceSummary(holder.address);

      expect(output.totalBalance).to.equal(transferAmount);
      expect(output.holdingBalance).to.equal(
        (transferAmount * (100 - recipientFee)) / 100,
      );
      expect(output.totalRewards).to.equal(
        (transferAmount * recipientFee) / 100,
      );
    });
  });

  context('transfer()', () => {
    createBeforeHook();

    it('expect to revert when recipient is the zero address', async () => {
      await expect(
        token.connect(excluded).transfer(constants.AddressZero, 100),
      ).to.be.revertedWith('MetaheroToken#19');
    });

    it('expect to revert when amount is zero', async () => {
      await expect(
        token.connect(excluded).transfer(randomAddress(), 0),
      ).to.be.revertedWith('MetaheroToken#21');
    });

    it('expect to transfer', async () => {
      const recipient = randomAddress();
      const value = 100;

      const tx = await token.connect(excluded).transfer(recipient, value);

      expect(tx)
        .to.emit(token, 'Transfer')
        .withArgs(excluded.address, recipient, value);
    });

    context('# account type combinations', () => {
      const accountBalance = 10000;

      createBeforeHook({
        burnFee: {
          sender: 0,
          recipient: 5,
        },
        transferToExclude: false,
        postBefore: async () => {
          await token.transfer(holder.address, accountBalance);
          await token.transfer(excluded.address, accountBalance);
        },
      });

      context('# between holder', () => {
        it('expect to revert when sender balance is too low', async () => {
          await expect(
            token.connect(holder).transfer(randomAddress(), TOTAL_SUPPLY),
          ).to.be.revertedWith('MetaheroToken#22');
        });
      });

      context('# from excluded to holder', () => {
        it('expect to revert when sender balance is too low', async () => {
          await expect(
            token.connect(excluded).transfer(randomAddress(), TOTAL_SUPPLY),
          ).to.be.revertedWith('MetaheroToken#23');
        });
      });

      context('# from holder to excluded', () => {
        it('expect to revert when sender balance is too low', async () => {
          await expect(
            token.connect(holder).transfer(excluded.address, TOTAL_SUPPLY),
          ).to.be.revertedWith('MetaheroToken#24');
        });

        it('expect to transfer without fee', async () => {
          const tx = token
            .connect(holder)
            .transfer(owner.address, accountBalance);

          expect(tx)
            .to.emit(token, 'Transfer')
            .withArgs(holder.address, owner.address, accountBalance);
        });
      });

      context('# between excluded', () => {
        it('expect to revert when sender balance is too low', async () => {
          await expect(
            token.connect(excluded).transfer(owner.address, TOTAL_SUPPLY),
          ).to.be.revertedWith('MetaheroToken#25');
        });
      });
    });

    context('# match total supply with fees()', () => {
      createBeforeHook({
        burnFee: {
          sender: 0,
          recipient: 5,
        },
        postBefore: async () => {
          await token
            .connect(excluded)
            .burn(TOTAL_SUPPLY.sub(MIN_TOTAL_SUPPLY));
        },
      });

      it('expect to disable burn fee', async () => {
        const recipient = randomAddress();
        const value = MIN_TOTAL_SUPPLY;

        await token.connect(excluded).transfer(recipient, value);

        expect(await token.balanceOf(recipient)).to.equal(value);
      });
    });
  });

  context('transferFrom()', () => {
    const allowance = 100;
    let spender: Signer;

    createBeforeHook({
      postBefore: async () => {
        spender = holder;
        await token.connect(excluded).approve(spender.address, allowance);
      },
    });

    it('expect to revert when amount exceeds allowance', async () => {
      await expect(
        token
          .connect(spender)
          .transferFrom(excluded.address, randomAddress(), allowance + 1),
      ).to.be.revertedWith('MetaheroToken#6');
    });

    it('expect to revert when sender is the zero address', async () => {
      await expect(
        token
          .connect(spender)
          .transferFrom(constants.AddressZero, excluded.address, allowance + 1),
      ).to.be.revertedWith('MetaheroToken#18');
    });

    it('expect to revert when recipient is the zero address', async () => {
      await expect(
        token
          .connect(spender)
          .transferFrom(excluded.address, constants.AddressZero, allowance + 1),
      ).to.be.revertedWith('MetaheroToken#19');
    });

    it('expect to transfer from', async () => {
      const recipient = randomAddress();

      await token
        .connect(spender)
        .transferFrom(excluded.address, recipient, allowance);

      expect(await token.allowance(holder.address, spender.address)).to.equal(
        0,
      );
    });
  });

  context('getExcludedAccount()', () => {
    createBeforeHook();

    it('expect to return correct excluded account', async () => {
      const { exists, excludeSenderFromFee, excludeRecipientFromFee } =
        await token.getExcludedAccount(excluded.address);

      expect(exists).to.be.true;
      expect(excludeSenderFromFee).to.be.false;
      expect(excludeRecipientFromFee).to.be.false;
    });

    it('expect to return empty excluded account', async () => {
      const { exists, excludeSenderFromFee, excludeRecipientFromFee } =
        await token.getExcludedAccount(randomAddress());

      expect(exists).to.be.false;
      expect(excludeSenderFromFee).to.be.false;
      expect(excludeRecipientFromFee).to.be.false;
    });
  });
});
