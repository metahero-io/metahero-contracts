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
} from '@metahero/contracts';

console.log(
  'MetaheroToken address on BNB Smart Chain:',
  getContractAddress(
    ContractNames.MetaheroToken,  // 'MetaheroToken'
  ),
);

console.log(
  'MetaheroToken address on BNB Smart Chain testnet:',
  getContractAddress(
    ContractNames.MetaheroToken,  // 'MetaheroToken'
    NetworkChainIds.BnbTest,      // 97
  ),
);
```

## License

[MIT][license-url]

[license-image]: https://img.shields.io/badge/License-MIT-yellow.svg
[license-url]: https://github.com/metahero-io/metahero-contracts/blob/master/LICENSE
