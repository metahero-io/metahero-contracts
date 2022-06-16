import { BigNumberish } from 'ethers';
import kleur from 'kleur';
import { task, types } from 'hardhat/config';

const TASK_NAME = 'faucet';

task(TASK_NAME, 'Faucet from hardhat account')
  .addOptionalParam('index', 'Hardhat account index', 0, types.int)
  .addOptionalParam('to', 'Recipient address', undefined, types.string)
  .addOptionalParam('value', 'Faucet value', '0.5', types.string)
  .addOptionalParam(
    'minBalance',
    'Minimal recipient balance',
    '0.5',
    types.string,
  )
  .setAction(
    async (
      args: { index: number; to: string; value: string; minBalance: string },
      hre,
    ) => {
      const {
        helpers: { getAccounts, createSigner },
        ethers: { utils, provider, BigNumber },
      } = hre;

      let to: string;
      let value: BigNumberish;
      let minBalance: BigNumberish;

      if (args.to) {
        try {
          to = utils.getAddress(args.to);
        } catch (er) {
          //
        }
      } else {
        [to] = await getAccounts();
      }

      try {
        value = utils.parseEther(args.value);
      } catch (er) {
        //
      }

      try {
        minBalance = utils.parseEther(args.minBalance);
      } catch (er) {
        minBalance = 0;
      }

      if (!to) {
        throw new Error('Invalid recipient address');
      }

      if (!value) {
        throw new Error('Invalid faucet value');
      }

      if (BigNumber.from(minBalance).lte(await provider.getBalance(to))) {
        return;
      }

      const signer = createSigner(null, args.index || 0);

      console.log(
        `Sending ${kleur.green(
          `${utils.formatEther(value)} ETH`,
        )} from ${kleur.dim(
          `Hardhat #${args.index}`,
        )} account to ${kleur.yellow(to)}...`,
      );

      const { hash, wait } = await signer.sendTransaction({
        to,
        value,
      });

      await wait();

      console.log();
      console.log(
        `${kleur.blue('→')} Transaction sent (hash: ${kleur.dim(hash)})`,
      );
    },
  );
