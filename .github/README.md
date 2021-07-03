# Metahero

[![NPM version][npm-image]][npm-url]
[![License MIT][license-image]][license-url]

## Token details

* [ERC20](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md) standard: 
  * Name - `Metahero`
  * Symbol - `HERO`
  * Decimals - `18`
* Total supply:
  * Initial - `10,000,000,000 HERO` _(configurable)_
  * Minimal - `100,000,000 HERO` _(configurable)_
* Transaction fees _(from each holder participant)_:
  * Liquidity pool fee - `3%` _(configurable)_ 
  * Burn fee - `1%` _(configurable)_
  * Rewards fee - `1%` _(configurable)_

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
| `<network config prefix>_PROVIDER_URL` | _optional_ |
| `<network config prefix>_PROVIDER_GAS` | _optional_ |
| `<network config prefix>_PROVIDER_GAS_PRICE` | _optional_ |

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
