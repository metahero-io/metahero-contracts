import { Contract } from './interfaces';

export function contractsJS(contracts: Record<string, Contract>): string {
  return `/* eslint-disable */

module.exports = ${JSON.stringify(contracts, null, 2)};
`;
}

export function constantsJS(
  chainIds: Record<string, number>,
  contracts: Record<string, Contract>,
): string {
  return `/* eslint-disable */

module.exports = {
  NetworkChainIds: {${Object.entries(chainIds)
    .map(([name, chainId]) => `\n    ${name}: ${chainId},`)
    .join('')}
  },
  ContractNames: {${Object.keys(contracts)
    .map((name) => `\n    ${name}: '${name}',`)
    .join('')}
  },
};
`;
}

export function constantsTS(
  chainIds: Record<string, number>,
  contracts: Record<string, Contract>,
): string {
  return `/* eslint-disable */

export enum NetworkChainIds {${Object.entries(chainIds)
    .map(([name, chainId]) => `\n  ${name} = ${chainId},`)
    .join('')}
}

export enum ContractNames {${Object.keys(contracts)
    .map((name) => `\n  ${name} = '${name}',`)
    .join('')}
}
`;
}
