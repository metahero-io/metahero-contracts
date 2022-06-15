import { helpers } from 'hardhat';
import { expect } from 'chai';
import { MetaheroToken } from '../../typechain';

const { deployContract } = helpers;

context('MetaheroToken', () => {
  context('# metadata', () => {
    let token: MetaheroToken;

    before(async () => {
      token = await deployContract('MetaheroToken');
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
