import { ethers, waffle, knownContracts } from 'hardhat';
import { expect } from 'chai';
import HEROTokenArtifact from '../artifacts/HEROToken.json';
import { HEROToken } from '../typings';

const { deployContract } = waffle;
const { getSigners } = ethers;

describe('HEROToken', () => {
  const LP_FEE = {
    sender: 5,
    recipient: 5,
  };
  const REWARDS_FEE = {
    sender: 0,
    recipient: 0,
  };

  let token: HEROToken;

  before(async () => {
    const [deployer] = await getSigners();

    token = (await deployContract(deployer, HEROTokenArtifact)) as HEROToken;

    await token.initialize(
      LP_FEE, //
      REWARDS_FEE,
      0,
      [],
      0,
      knownContracts.getAddress('SwapRouter'),
      knownContracts.getAddress('BUSDToken'),
    );
  });

  context('# metadata', () => {
    it('expect to return correct name', async () => {
      expect(await token.name()).to.equal('Metahero');
    });

    it('expect to return correct symbol', async () => {
      expect(await token.symbol()).to.equal('HERO');
    });

    it('expect to return correct decimals', async () => {
      expect(await token.decimals()).to.equal(18);
    });
  });
});
