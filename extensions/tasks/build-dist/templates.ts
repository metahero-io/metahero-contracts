import { getNetworkExplorerUrl, getNetworkTitle } from '../../utils';
import { ContractsMD } from './interfaces';

function contractsJs(data: unknown): string {
  return `/* eslint-disable */

module.exports = ${JSON.stringify(data, null, 2)};
`;
}

function constantsJs(data: string[]): string {
  return `/* eslint-disable */

module.exports = {
  ContractNames: {${data.map((name) => `\n    ${name}: '${name}',`).join('')}
  },
};
`;
}

function constantsDts(data: string[]): string {
  return `export declare enum ContractNames {${data
    .map((name) => `\n  ${name} = '${name}',`)
    .join('')}
}
`;
}

function deploymentsMd(data: ContractsMD): string {
  let result = '# Deployments\n\n';

  const entries = Object.entries(data);

  for (const [network, contracts] of entries) {
    const entries = Object.entries(contracts);

    result = `${result}## ${getNetworkTitle(network)}

| contract | deployed at | transaction hash |  
| --- | --- | --- |`;

    for (const [contractName, { address, transactionHash }] of entries) {
      const addressUrl = getNetworkExplorerUrl(network, address, 'address');
      const transactionUrl = getNetworkExplorerUrl(
        network,
        transactionHash,
        'transaction',
      );

      result = `${result}
| \`${contractName}\` | [${address}](${addressUrl}#code) | [${transactionHash}](${transactionUrl}) |`;
    }

    result = `${result}\n\n`;
  }

  return result;
}

export default {
  contractsJs,
  constantsJs,
  constantsDts,
  deploymentsMd,
};
