import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import MathLibMockArtifact from '../../../artifacts/MathLibMock.json';
import { MathLibMock } from '../../../typings';

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

  context('percent()', () => {
    it('expect to return correct percentage results', async () => {
      expect(await mathLib.percent(200, 20)).to.equal(40);
      expect(await mathLib.percent(0, 20)).to.equal(0);
      expect(await mathLib.percent(1, 0)).to.equal(0);
      expect(await mathLib.percent(5, 50)).to.equal(2);
    });
  });
});
