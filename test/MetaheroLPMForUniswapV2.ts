import { ethers, waffle, knownContracts, onlyWhileForking } from 'hardhat';
import { expect } from 'chai';
import { BigNumberish, constants, utils } from 'ethers';
import ERC20MockArtifact from '../artifacts/ERC20Mock.json';
import MetaheroTokenArtifact from '../artifacts/MetaheroToken.json';
import MetaheroLPMForUniswapV2Artifact from '../artifacts/MetaheroLPMForUniswapV2.json';
import {
  ERC20Mock,
  MetaheroLPMForUniswapV2,
  MetaheroToken,
  IUniswapV2Pair,
  IUniswapV2Pair__factory as IUniswapV2PairFactory,
  IUniswapV2Router02,
  IUniswapV2Router02__factory as IUniswapV2Router02Factory,
  IWrappedNative,
  IWrappedNative__factory as IWrappedNativeFactory,
} from '../typings';
import { Signer, setNextBlockTimestamp } from './helpers';

const { deployContract } = waffle;
const { getSigners } = ethers;

onlyWhileForking(() => {
  describe('MetaheroLPMForUniswapV2', () => {
    const BURN_FEE = {
      sender: 1,
      recipient: 1,
    };
    const LP_FEE = {
      sender: 3,
      recipient: 3,
    };
    const REWARDS_FEE = {
      sender: 1,
      recipient: 1,
    };
    const STABLE_COIN_TOTAL_SUPPLY = utils.parseEther('10');
    const TOKEN_TOTAL_SUPPLY = utils.parseEther('10000000');

    let owner: Signer;
    let holders: Signer[];
    let stableCoin: ERC20Mock;
    let token: MetaheroToken;
    let lpManager: MetaheroLPMForUniswapV2;
    let wrappedNative: IWrappedNative;
    let uniswapRouter: IUniswapV2Router02;
    let uniswapPair: IUniswapV2Pair;

    before(async () => {
      [owner, ...holders] = await getSigners();

      uniswapRouter = await IUniswapV2Router02Factory.connect(
        knownContracts.getAddress('UniswapV2Router'),
        owner,
      );

      wrappedNative = IWrappedNativeFactory.connect(
        await uniswapRouter.WETH(), //
        owner,
      );

      stableCoin = (await deployContract(
        owner,
        ERC20MockArtifact,
      )) as ERC20Mock;

      await stableCoin.setBalance(owner.address, STABLE_COIN_TOTAL_SUPPLY);

      await stableCoin.approve(uniswapRouter.address, STABLE_COIN_TOTAL_SUPPLY);

      const deadline = await setNextBlockTimestamp();

      await uniswapRouter.addLiquidityETH(
        stableCoin.address,
        STABLE_COIN_TOTAL_SUPPLY,
        0,
        0,
        owner.address,
        deadline,
        {
          value: STABLE_COIN_TOTAL_SUPPLY,
        },
      );
    });

    const addLiquidity = async (options: {
      tokenLiquidity: BigNumberish;
      nativeLiquidity: BigNumberish;
    }) => {
      const { tokenLiquidity, nativeLiquidity } = options;

      await token.approve(uniswapRouter.address, tokenLiquidity);

      const deadline = await setNextBlockTimestamp();

      await uniswapRouter.addLiquidityETH(
        token.address,
        tokenLiquidity,
        0,
        0,
        lpManager.address,
        deadline,
        {
          value: nativeLiquidity,
        },
      );
    };

    const createBeforeHook = (
      options: {
        initialize?: boolean;
        tokenLiquidity?: BigNumberish;
        nativeLiquidity?: BigNumberish;
        enableBurnLPAtValue?: BigNumberish;
        postBefore?: () => Promise<void>;
      } = {},
    ) => {
      const {
        initialize,
        nativeLiquidity,
        tokenLiquidity,
        enableBurnLPAtValue,
        postBefore,
      } = {
        initialize: true,
        enableBurnLPAtValue: 0,
        ...options,
      };

      before(async () => {
        lpManager = (await deployContract(
          owner,
          MetaheroLPMForUniswapV2Artifact,
        )) as MetaheroLPMForUniswapV2;

        token = (await deployContract(
          owner,
          MetaheroTokenArtifact,
        )) as MetaheroToken;

        if (initialize) {
          await lpManager.initialize(
            enableBurnLPAtValue,
            stableCoin.address,
            token.address,
            uniswapRouter.address,
          );

          uniswapPair = IUniswapV2PairFactory.connect(
            await lpManager.uniswapPair(), //
            owner,
          );

          await token.initialize(
            BURN_FEE,
            LP_FEE,
            REWARDS_FEE,
            0,
            lpManager.address,
            constants.AddressZero,
            TOKEN_TOTAL_SUPPLY,
            [
              lpManager.address, //
              uniswapPair.address,
            ],
          );

          await token.finishPresale();

          if (nativeLiquidity && tokenLiquidity) {
            await addLiquidity({
              tokenLiquidity,
              nativeLiquidity,
            });
          }

          if (postBefore) {
            await postBefore();
          }
        }
      });
    };

    context('receive()', () => {
      createBeforeHook();

      it('expect to revert when msg.value is zero', async () => {
        await expect(
          owner.sendTransaction({
            to: lpManager.address,
            value: 0,
          }),
        ).to.be.revertedWith('MetaheroLPMForUniswapV2#1');
      });

      it('expect mint wrapped native', async () => {
        const value = 100;
        const balanceBefore = await wrappedNative.balanceOf(lpManager.address);

        await owner.sendTransaction({
          to: lpManager.address,
          value,
        });

        expect(await wrappedNative.balanceOf(lpManager.address)).to.equal(
          balanceBefore.add(value),
        );
      });
    });

    context('initialize()', () => {
      createBeforeHook({
        initialize: false,
      });

      it('expect to revert when stable coin is the zero address', async () => {
        await expect(
          lpManager.initialize(
            1,
            constants.AddressZero,
            token.address,
            uniswapRouter.address,
          ),
        ).to.be.revertedWith('MetaheroLPMForUniswapV2#2');
      });

      it('expect to revert when uniswap router is the zero address', async () => {
        await expect(
          lpManager.initialize(
            0,
            constants.AddressZero,
            token.address,
            constants.AddressZero,
          ),
        ).to.be.revertedWith('MetaheroLPMForUniswapV2#3');
      });

      it('expect to initialize the contract', async () => {
        const tx = await lpManager.initialize(
          0,
          constants.AddressZero,
          token.address,
          uniswapRouter.address,
        );

        expect(tx).to.emit(lpManager, 'Initialized');
      });

      it('expect to revert when contract is initialized', async () => {
        await expect(
          lpManager.initialize(
            0,
            constants.AddressZero,
            token.address,
            uniswapRouter.address,
          ),
        ).to.be.revertedWith('Initializable#1');
      });
    });

    context('_syncLP()', () => {
      createBeforeHook({
        tokenLiquidity: utils.parseEther('1000000'),
        nativeLiquidity: utils.parseEther('10'),
      });

      it('expect to sync lp', async () => {
        const tokenPending = TOKEN_TOTAL_SUPPLY.div(2000);

        await token.transfer(lpManager.address, tokenPending);

        const pairTokenBalance = await token.balanceOf(uniswapPair.address);

        await token.transfer(owner.address, 0);

        expect(await token.balanceOf(uniswapPair.address)).to.gt(
          pairTokenBalance,
        );
      });
    });

    context('_burnLP()', () => {
      createBeforeHook();

      context('# with token reserve value check', () => {
        createBeforeHook({
          enableBurnLPAtValue: 40000,
        });

        it('expect to revert when token reserve is too low', async () => {
          await expect(lpManager.burnLP(50000)).to.be.revertedWith(
            'MetaheroLPMForUniswapV2#4',
          );
        });

        it('expect to revert when token amount is higher than reserve', async () => {
          await addLiquidity({
            tokenLiquidity: 50000,
            nativeLiquidity: 50000,
          });

          await expect(lpManager.burnLP(70000)).to.be.revertedWith(
            'MetaheroLPMForUniswapV2#5',
          );
        });

        it('expect to revert when token reserve value is too low', async () => {
          await expect(lpManager.burnLP(100)).to.be.revertedWith(
            'MetaheroLPMForUniswapV2#6',
          );
        });

        it('expect to revert when burn value is too height', async () => {
          await addLiquidity({
            tokenLiquidity: 50000,
            nativeLiquidity: 50000,
          });

          await expect(lpManager.burnLP(50000)).to.be.revertedWith(
            'MetaheroLPMForUniswapV2#7',
          );
        });

        it('expect to burn LP', async () => {
          const amount = 1000;

          const tx = await lpManager.burnLP(amount);

          expect(tx).to.emit(lpManager, 'LPBurnt').withArgs(amount);
        });
      });

      context('# without token reserve value check', () => {
        createBeforeHook();

        it('expect to revert when amount is higher than lp balance', async () => {
          await expect(lpManager.burnLP(50000)).to.be.revertedWith(
            'MetaheroLPMForUniswapV2#8',
          );
        });

        it('expect to burn LP', async () => {
          await addLiquidity({
            tokenLiquidity: 100000,
            nativeLiquidity: 10000,
          });

          const amount = 50000;

          const tx = await lpManager.burnLP(amount);

          expect(tx).to.emit(lpManager, 'LPBurnt').withArgs(amount);
        });

        context('# burn all', () => {
          const amount = 1000;

          createBeforeHook({
            postBefore: async () => {
              await token.transfer(lpManager.address, amount);
            },
          });

          it('expect to burn LP', async () => {
            const tx = await lpManager.burnLP(amount);

            expect(tx).to.emit(lpManager, 'LPBurnt').withArgs(amount);

            expect(await token.balanceOf(lpManager.address)).to.equal(0);
          });
        });
      });
    });

    context('# example scenario', () => {
      createBeforeHook({
        tokenLiquidity: utils.parseEther('1000000'),
        nativeLiquidity: utils.parseEther('10'),
      });

      it('expect to transfer from exclude to holder#0', async () => {
        const amount = utils.parseEther('100000');

        const pairTokenBalance = await token.balanceOf(uniswapPair.address);

        await token.transfer(holders[0].address, amount);

        expect(await token.balanceOf(uniswapPair.address)).to.equal(
          pairTokenBalance,
        );
      });

      it('expect to transfer from holder#0 to holder#1', async () => {
        const amount = utils.parseEther('4000');

        const pairTokenBalance = await token.balanceOf(uniswapPair.address);

        await token.connect(holders[0]).approve(holders[1].address, amount);

        await token
          .connect(holders[1])
          .transferFrom(holders[0].address, holders[1].address, amount);

        expect(await token.balanceOf(uniswapPair.address)).to.gt(
          pairTokenBalance,
        );
      });

      it('expect to transfer from holder#0 to holder#1', async () => {
        const amount = utils.parseEther('1000');

        const pairTokenBalance = await token.balanceOf(uniswapPair.address);

        await token.connect(holders[0]).transfer(holders[1].address, amount);

        expect(await token.balanceOf(uniswapPair.address)).to.gt(
          pairTokenBalance,
        );
      });

      it('expect to swap tokens to native by holder#1', async () => {
        const path = [token.address, wrappedNative.address];
        const amount = utils.parseEther('90');
        const minAmount = 1;

        const pairTokenBalance = await token.balanceOf(uniswapPair.address);

        await token.connect(holders[1]).approve(uniswapRouter.address, amount);

        const deadline = await setNextBlockTimestamp();

        await uniswapRouter
          .connect(holders[1])
          .swapExactTokensForETHSupportingFeeOnTransferTokens(
            amount,
            minAmount,
            path,
            holders[1].address,
            deadline,
          );

        expect(await token.balanceOf(uniswapPair.address)).to.gt(
          pairTokenBalance,
        );
      });

      it('expect to swap native to tokens by holder#1', async () => {
        const path = [wrappedNative.address, token.address];
        const minAmount = 1;
        const value = utils.parseEther('0.01');
        const deadline = await setNextBlockTimestamp();

        const pairNativeBalance = await wrappedNative.balanceOf(
          uniswapPair.address,
        );

        await uniswapRouter
          .connect(holders[1])
          .swapExactETHForTokensSupportingFeeOnTransferTokens(
            minAmount,
            path,
            holders[1].address,
            deadline,
            {
              value,
            },
          );

        expect(await wrappedNative.balanceOf(uniswapPair.address)).to.gt(
          pairNativeBalance,
        );
      });
    });
  });
});
