import { ethers, waffle } from 'hardhat';
import { expect } from 'chai';
import MetaheroTokenArtifact from '../../artifacts/MetaheroToken.json';
import { MetaheroToken } from '../../typings';

const { deployContract } = waffle;
const { getSigners } = ethers;

context('MetaheroToken', () => {
  context('# metadata', () => {
    let token: MetaheroToken;

    before(async () => {
      const [owner] = await getSigners();
      token = (await deployContract(
        owner,
        MetaheroTokenArtifact,
      )) as MetaheroToken;
    });

    context('name()', () => {
      it('expect to return correct name', async () => {
        expect(await token.name()).to.equal('Metahero');
      });
    });

    context('symbol()', () => {
      it('expect to return correct symbol', async () => {
        expect(await token.symbol()).to.equal('HERO');
      });
    });

    context('decimals()', () => {
      it('expect to return correct decimals', async () => {
        expect(await token.decimals()).to.equal(18);
      });
    });
  });
});
