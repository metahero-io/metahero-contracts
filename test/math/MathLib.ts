import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import { constants } from 'ethers';
import MathLibMockArtifact from '../../artifacts/MathLibMock.json';
import { MathLibMock } from '../../typings';

const { deployContract } = waffle;
const { getSigners } = ethers;

describe('MathLib (using mock)', () => {
  let mathLib: MathLibMock;

  before(async () => {
    const [deployer] = await getSigners();

    mathLib = (await deployContract(
      deployer,
      MathLibMockArtifact,
    )) as MathLibMock;
  });

  context('add()', () => {
    it('expect to revert on addition overflow', async () => {
      await expect(mathLib.add(constants.MaxUint256, 1)).to.be.revertedWith(
        'MathLib#1',
      );
    });

    it('expect to return correct addition results', async () => {
      expect(await mathLib.add(1, 2)).to.equal(3);
      expect(await mathLib.add(0, 0)).to.equal(0);
    });
  });

  context('sub()', () => {
    it('expect to revert on subtraction overflow', async () => {
      await expect(mathLib.sub(1, 3)).to.be.revertedWith('MathLib#2');
    });

    it('expect to return correct subtraction results', async () => {
      expect(await mathLib.sub(3, 1)).to.equal(2);
      expect(await mathLib.sub(3, 3)).to.equal(0);
    });
  });

  context('mul()', () => {
    it('expect to revert on multiplication overflow', async () => {
      await expect(mathLib.mul(constants.MaxUint256, 2)).to.be.revertedWith(
        'MathLib#3',
      );
    });

    it('expect to return correct multiplication results', async () => {
      expect(await mathLib.mul(2, 3)).to.equal(6);
      expect(await mathLib.mul(3, 3)).to.equal(9);
      expect(await mathLib.mul(3, 0)).to.equal(0);
      expect(await mathLib.mul(0, 3)).to.equal(0);
    });
  });

  context('div()', () => {
    it('expect to revert on division by zero', async () => {
      await expect(mathLib.div(10, 0)).to.be.revertedWith('MathLib#4');
    });

    it('expect to return correct division results', async () => {
      expect(await mathLib.div(6, 2)).to.equal(3);
      expect(await mathLib.div(6, 6)).to.equal(1);
      expect(await mathLib.div(0, 6)).to.equal(0);
      expect(await mathLib.div(5, 2)).to.equal(2);
    });
  });

  context('percent()', () => {
    it('expect to return correct percentage results', async () => {
      expect(await mathLib.percent(200, 20)).to.equal(40);
      expect(await mathLib.percent(0, 20)).to.equal(0);
      expect(await mathLib.percent(1, 0)).to.equal(0);
      expect(await mathLib.percent(5, 50)).to.equal(2);
    });
  });
});
