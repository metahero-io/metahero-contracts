import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, helpers } from 'hardhat';
import { expect } from 'chai';
import { ERC20BasicMock } from '../../typechain';

const {
  constants: { AddressZero },
} = ethers;

const {
  getSigners,
  deployContract,
  processTransaction,
  resetSnapshots,
  revertSnapshot,
  randomAddress,
} = helpers;

describe('ERC20Basic (using mock)', () => {
  const totalSupply = 1000000;

  let erc20: ERC20BasicMock;
  let deployer: SignerWithAddress;
  let account: SignerWithAddress;

  before(async () => {
    [deployer, account] = await getSigners();

    erc20 = await deployContract('ERC20BasicMock', totalSupply);
  });

  after(() => {
    resetSnapshots();
  });

  describe('# internal functions (views)', () => {
    const data = {
      amount: 1000000,
    };

    before(async () => {
      await revertSnapshot();
    });

    before(async () => {
      await processTransaction(erc20.transfer(account.address, data.amount));
    });

    describe('_balanceOf()', () => {
      it('expect to return correct balance', async () => {
        expect(await erc20.balanceOf(account.address)).to.eq(data.amount);
      });
    });
  });

  describe('# internal function', () => {
    describe('_mintHandler()', () => {
      const data = {
        amount: 10000,
      };

      before(async () => {
        await revertSnapshot();
      });

      it('expect to mint tokens', async () => {
        const to = randomAddress();

        const { tx } = await processTransaction(erc20.mint(to, data.amount));

        await expect(tx)
          .to.emit(erc20, 'Transfer')
          .withArgs(AddressZero, to, data.amount);

        expect(await erc20.balanceOf(to)).to.eq(data.amount);
        expect(await erc20.totalSupply()).to.eq(totalSupply + data.amount);
      });
    });

    describe('_burnHandler()', () => {
      const data = {
        from: randomAddress(),
        amount: 10000,
      };

      before(async () => {
        await revertSnapshot();
      });

      it('expect to burn tokens', async () => {
        const { tx } = await processTransaction(
          erc20.burn(deployer.address, data.amount),
        );

        await expect(tx)
          .to.emit(erc20, 'Transfer')
          .withArgs(deployer.address, AddressZero, data.amount);

        expect(await erc20.balanceOf(deployer.address)).to.eq(
          totalSupply - data.amount,
        );
        expect(await erc20.totalSupply()).to.eq(totalSupply - data.amount);
      });
    });

    describe('_transferHandler()', () => {
      const data = {
        amount: 10000,
      };

      before(async () => {
        await revertSnapshot();

        await processTransaction(erc20.transfer(account.address, data.amount));
      });

      it('expect to transfer tokens', async () => {
        const to = randomAddress();

        const { tx } = await processTransaction(
          erc20.connect(account).transfer(to, data.amount),
        );

        await expect(tx)
          .to.emit(erc20, 'Transfer')
          .withArgs(account.address, to, data.amount);

        expect(await erc20.balanceOf(account.address)).to.eq(0);

        expect(await erc20.balanceOf(to)).to.eq(data.amount);
      });
    });
  });
});
