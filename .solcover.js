module.exports = {
  istanbulReporter: [
    'html', //
    'text',
    'json',
  ],
  skipFiles: [
    'core/erc20/ERC20Mock.sol', //
    'pancakeswap',
    'uniswapV2',
  ],
};
