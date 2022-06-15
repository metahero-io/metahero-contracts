import { helpers } from 'hardhat';
import { expect } from 'chai';
import { MathLibMock } from '../../../typechain';

const { deployContract } = helpers;

describe('MathLib (using mock)', () => {
  let mathLib: MathLibMock;

  before(async () => {
    mathLib = await deployContract('MathLibMock');
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
