import { task } from 'hardhat/config';
import {
  readdir,
  readFile,
  readJSON,
  writeFile,
  pathExists,
  mkdirp,
} from 'fs-extra';
import { resolve, join } from 'path';
import { ContractsMD } from './interfaces';
import templates from './templates';

const TASK_BUILD_DIST = 'build-dist';

task(TASK_BUILD_DIST, 'Build dist', async (args, hre) => {
  const {
    config: { buildPaths, paths, networks },
  } = hre;

  let { artifacts: artifactsPath, dist: distPath } = {
    artifacts: 'artifacts',
    dist: 'dist',
    ...(buildPaths || {}),
  };

  let { deployments: deploymentsPath } = {
    ...paths,
    deployments: 'deployments',
  };

  const networkNames = Object.keys(networks);

  const cwd = process.cwd();

  artifactsPath = resolve(cwd, artifactsPath);
  distPath = resolve(cwd, distPath);
  deploymentsPath = resolve(cwd, deploymentsPath);

  if ((await pathExists(artifactsPath)) && (await pathExists(distPath))) {
    await mkdirp(distPath);

    const networks: { name: string; chainId: string; path: string }[] = [];

    for (const name of networkNames) {
      if (name !== 'hardhat' && name !== 'local' && name !== 'localhost') {
        const path = join(deploymentsPath, name);

        const chainFilePath = join(path, '.chainId');

        if (await pathExists(chainFilePath)) {
          const chainId = await readFile(chainFilePath, 'utf8');

          networks.push({
            name,
            chainId,
            path,
          });
        }
      }
    }

    const contracts: {
      [key: string]: {
        abi: any;
        addresses: { [key: string]: string };
      };
    } = {};

    const contractsMD: ContractsMD = {};

    const fileNames = await readdir(artifactsPath);

    for (const fileName of fileNames) {
      if (fileName.endsWith('.json')) {
        const contractName = fileName.slice(0, -5);

        if (!contractName.endsWith('Mock') && !contractName.endsWith('Lib')) {
          const filePath = join(artifactsPath, fileName);

          const addresses: { [key: string]: string } = {};
          let deployed = false;

          for (const network of networks) {
            const { chainId, path, name } = network;
            let address: string = null;
            let transactionHash: string = null;

            try {
              ({ address, transactionHash } = await readJSON(
                join(path, fileName),
              ));
            } catch (err) {
              address = null;
            }

            addresses[chainId] = address;

            if (address && transactionHash) {
              deployed = true;

              if (!contractsMD[name]) {
                contractsMD[name] = {};
              }

              contractsMD[name][contractName] = {
                address,
                transactionHash,
              };
            }
          }

          if (deployed) {
            const { abi }: { abi: any } = await readJSON(filePath);

            contracts[contractName] = {
              abi,
              addresses,
            };
          }
        }
      }
    }

    const contractNames = Object.keys(contracts);

    await writeFile(
      join(distPath, 'contracts.js'),
      templates.contractsJs(contracts),
    );

    await writeFile(
      join(distPath, 'constants.js'),
      templates.constantsJs(contractNames),
    );

    await writeFile(
      join(distPath, 'constants.d.ts'),
      templates.constantsDts(contractNames),
    );

    await writeFile(
      join(cwd, 'deployments', 'README.md'),
      templates.deploymentsMd(contractsMD),
    );

    console.log('Dist built successfully');
  }
});
