# Metahero

[![NPM version][npm-image]][npm-url]
[![License MIT][license-image]][license-url]

## Token details

* _[ERC20](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md)  standard_: 
  * _Name_ - `Metahero`
  * _Symbol_ - `HERO`
  * _Decimals_ - `18`
* _Total Supply_:
  * _Initial_ - `10,000,000,000 HERO` (configurable)
  * _Minimal_ - `100,000,000 HERO` (configurable)
* _Transaction Fees (from each holder participant)_:
    * Liquidity pool fee - `3%` (configurable) 
    * Burn fee - `1%` (configurable)
    * Rewards fee - `1%` (configurable)

## [Deployments](../deployments/README.md)

## Development

### Supported networks

| network | config prefix | script alias |
| --- | --- | --- |
| Binance Smart Chain | `BSC` | `bsc` |
| Binance Smart Chain (testnet) | `BSC_TEST` | `bscTest` |

### Configuration

via `env` variables:

| name | note |
| --- | --- |
| `<network config prefix>_PROVIDER_PRIVATE_KEY` | |
| `<network config prefix>_PROVIDER_URL` | optional |
| `<network config prefix>_PROVIDER_GAS` | optional |
| `<network config prefix>_PROVIDER_GAS_PRICE` | optional |

### Deployment

```bash
$ # npm run <network script alias>:deploy
$ # example:
$ npm run bsc:deploy  # starts contracts deployment to BSC
```

### Testing

```bash
$ npm run test                  # runs tests
$ npm run test -- --report-gas  # runs tests with gas report
$ npm run coverage              # runs coverage
```

## License

MIT

[npm-image]: https://badge.fury.io/js/%40metahero%2Fcontracts.svg
[npm-url]: https://npmjs.org/package/@metahero/contracts
[license-image]: https://img.shields.io/badge/License-MIT-yellow.svg
[license-url]: https://github.com/metahero-token/metahero-contracts/blob/master/LICENSE
