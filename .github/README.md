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

## [NPM](../README.md)

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
| `<network config prefix>_LPM_FOR_UNISWAP_V2_ENABLE_BURN_LP_AT_VALUE` | _default_ `10,000,000.000000000000000000` |
| `<network config prefix>_TOKEN_SENDER_BURN_FEE` | _default_ `1` |
| `<network config prefix>_TOKEN_RECIPIENT_BURN_FEE` | _default_ `1` |
| `<network config prefix>_TOKEN_SENDER_LP_FEE` | _default_ `3` |
| `<network config prefix>_TOKEN_RECIPIENT_LP_FEE` | _default_ `3` |
| `<network config prefix>_TOKEN_SENDER_REWARDS_FEE` | _default_ `1` |
| `<network config prefix>_TOKEN_RECIPIENT_REWARDS_FEE` | _default_ `1`  |
| `<network config prefix>_TOKEN_TOTAL_SUPPLY` | _default_ `10,000,000,000.000000000000000000` |
| `<network config prefix>_TOKEN_MIN_TOTAL_SUPPLY` | _default_ `100,000,000.000000000000000000` |
| `<network config prefix>_PRESALE_TOKENS_AMOUNT_PER_NATIVE` | _default_ `200000` |
| `<network config prefix>_PRESALE_MIN_PURCHASE_PRICE` | _default_ `0.100000000000000000` |
| `<network config prefix>_PRESALE_MAX_PURCHASE_PRICE` | _default_ `10.000000000000000000` |
| `<network config prefix>_PRESALE_TOTAL_TOKENS` | _default_ `1,000,000,000.000000000000000000` |

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
