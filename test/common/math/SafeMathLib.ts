import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import { constants } from 'ethers';
import SafeMathLibMockArtifact from '../../../artifacts/SafeMathLibMock.json';
import { SafeMathLibMock } from '../../../typings';

const { deployContract } = waffle;
const { getSigners } = ethers;

describe('SafeMathLib (using mock)', () => {
  let safeMathLib: SafeMathLibMock;

  before(async () => {
    const [deployer] = await getSigners();

    safeMathLib = (await deployContract(
      deployer,
      SafeMathLibMockArtifact,
    )) as SafeMathLibMock;
  });

  context('add()', () => {
    it('expect to revert on addition overflow', async () => {
      await expect(safeMathLib.add(constants.MaxUint256, 1)).to.be.revertedWith(
        'SafeMathLib#1',
      );
    });

    it('expect to return correct addition results', async () => {
      expect(await safeMathLib.add(1, 2)).to.equal(3);
      expect(await safeMathLib.add(0, 0)).to.equal(0);
    });
  });

  context('sub()', () => {
    it('expect to revert on subtraction overflow', async () => {
      await expect(safeMathLib.sub(1, 3)).to.be.revertedWith('SafeMathLib#2');
    });

    it('expect to return correct subtraction results', async () => {
      expect(await safeMathLib.sub(3, 1)).to.equal(2);
      expect(await safeMathLib.sub(3, 3)).to.equal(0);
    });
  });

  context('mul()', () => {
    it('expect to revert on multiplication overflow', async () => {
      await expect(safeMathLib.mul(constants.MaxUint256, 2)).to.be.revertedWith(
        'SafeMathLib#3',
      );
    });

    it('expect to return correct multiplication results', async () => {
      expect(await safeMathLib.mul(2, 3)).to.equal(6);
      expect(await safeMathLib.mul(3, 3)).to.equal(9);
      expect(await safeMathLib.mul(3, 0)).to.equal(0);
      expect(await safeMathLib.mul(0, 3)).to.equal(0);
    });
  });

  context('div()', () => {
    it('expect to revert on division by zero', async () => {
      await expect(safeMathLib.div(10, 0)).to.be.revertedWith('SafeMathLib#4');
    });

    it('expect to return correct division results', async () => {
      expect(await safeMathLib.div(6, 2)).to.equal(3);
      expect(await safeMathLib.div(6, 6)).to.equal(1);
      expect(await safeMathLib.div(0, 6)).to.equal(0);
      expect(await safeMathLib.div(5, 2)).to.equal(2);
    });
  });
});
