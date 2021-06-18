const contracts = require('./contracts');

function getContractAbi(contractName) {
  return contracts[contractName] ? contracts[contractName].abi || null : null;
}

function getContractAddress(contractName, networkId) {
  return networkId && contracts[contractName]
    ? contracts[contractName].addresses[`${networkId}`] || null
    : null;
}

module.exports = {
  getContractAbi,
  getContractAddress,
};
