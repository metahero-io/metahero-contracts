import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, helpers } from 'hardhat';
import { expect } from 'chai';
import { ERC20SnapshotMock } from '../../typechain';

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
  increaseNextBlockTimestamp,
} = helpers;

describe('ERC20Snapshot (using mock)', () => {
  const totalSupply = 1000000;
  const snapshotWindowLength = 20;

  let erc20: ERC20SnapshotMock;
  let deployer: SignerWithAddress;
  let account: SignerWithAddress;
  let baseTimestamp: number;

  before(async () => {
    baseTimestamp = await increaseNextBlockTimestamp();

    [deployer, account] = await getSigners();

    erc20 = await deployContract('ERC20SnapshotMock', totalSupply);

    await processTransaction(
      erc20.setSnapshotWindowLength(snapshotWindowLength),
    );

    await revertSnapshot();
  });

  after(() => {
    resetSnapshots();
  });

  describe('# external functions (views)', () => {
    const data = {
      snapshotId: 2,
      proposalId: 1,
      balance: 100,
    };

    before(async () => {
      await increaseNextBlockTimestamp(snapshotWindowLength + 1); // next snapshot

      await processTransaction(erc20.transfer(account.address, data.balance));
    });

    describe('getSnapshotIdAt()', () => {
      it('expect to return correct snapshot id', async () => {
        expect(
          await erc20.computeSnapshotId(
            baseTimestamp + snapshotWindowLength * (data.snapshotId - 1),
          ),
        ).to.eq(data.snapshotId);
      });

      it('expect to return zero on previous than base timestamp', async () => {
        expect(await erc20.computeSnapshotId(baseTimestamp - 1)).to.eq(0);
      });
    });

    describe('balanceOfAt()', () => {
      it('expect to return correct balance', async () => {
        expect(await erc20.balanceOfAt(account.address, data.snapshotId)).to.eq(
          data.balance,
        );
      });

      it('expect to return zero on previous snapshot id', async () => {
        expect(
          await erc20.balanceOfAt(account.address, data.snapshotId - 1),
        ).to.eq(0);
      });
    });
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
    describe('_setSnapshotWindowLength()', () => {
      before(async () => {
        await revertSnapshot();
      });

      it('expect to revert when snapshot window length is zero', async () => {
        await expect(erc20.setSnapshotWindowLength(0)).revertedWith(
          'InvalidSnapshotWindowLength()',
        );
      });

      it('expect to set snapshot window length', async () => {
        await processTransaction(
          erc20.setSnapshotWindowLength(snapshotWindowLength),
        );
      });
    });

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
