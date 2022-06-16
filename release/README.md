# Metahero contracts

[![License MIT][license-image]][license-url]
[![NPM version][npm-image]][npm-url]

## Installation

```bash
$ npm i @metahero/contracts
```

## Usage

### TypeScript

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

### JavaScript

```javascript
const {
  ContractNames,
  NetworkChainIds,
  getContractAddress, 
  getContractABI,
} = require('@metahero/contracts');

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
[npm-image]: https://badge.fury.io/js/%40metahero%2Fcontracts.svg
[npm-url]: https://npmjs.org/package/@metahero/contracts
