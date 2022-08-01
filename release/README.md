# Metahero contracts

[![License MIT][license-image]][license-url]

## Installation

```bash
$ npm i @metahero/contracts
```

## Usage

```typescript
import { 
  ContractNames, 
  NetworkChainIds, 
  getContractAddress, 
  getContractABI,
} from '@metahero/contracts';

console.log(
  'MetaheroToken bsc address:',
  getContractAddress(
    ContractNames.MetaheroToken,  // or 'MetaheroToken'
    NetworkChainIds.Bsc,          // or 56
  ),
);

console.log(
  'MetaheroToken abi:',
  getContractABI(
    ContractNames.MetaheroToken,  // or 'MetaheroToken'
  ),
);
```

## License

[MIT][license-url]

[license-image]: https://img.shields.io/badge/License-MIT-yellow.svg
[license-url]: https://github.com/metahero-io/metahero-contracts/blob/master/LICENSE
