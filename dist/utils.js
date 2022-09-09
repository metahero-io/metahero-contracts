const { NetworkChainIds } = require('./constants');
const contracts = require('./contracts');

function getContractAddress(contractName, chainId = null) {
  let result;

  try {
    result =
      contracts[contractName].addresses[`${chainId || NetworkChainIds.Bsc}`];
  } catch (err) {
    //
  }

  return result || null;
}

module.exports = {
  getContractAddress,
};
