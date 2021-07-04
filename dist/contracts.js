/* eslint-disable */

module.exports = {
  "MetaheroLPMForUniswapV2": {
    "abi": [
      {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "enableBurnLPAtValue",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "stableCoin",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "token",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "uniswapRouter",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "uniswapPair",
            "type": "address"
          }
        ],
        "name": "Initialized",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "LPBurnt",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "OwnerUpdated",
        "type": "event"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "burnLP",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "sender",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "recipient",
            "type": "address"
          }
        ],
        "name": "canSyncLP",
        "outputs": [
          {
            "internalType": "bool",
            "name": "shouldSyncLPBefore",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "shouldSyncLPAfter",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "deposit",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "enableBurnLPAtValue",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "stableCoin",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "token_",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "uniswapRouter_",
            "type": "address"
          }
        ],
        "name": "initialize",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "initialized",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "locked",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "owner_",
            "type": "address"
          }
        ],
        "name": "setOwner",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "settings",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "enableBurnLPAtValue",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "stableCoin",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "syncLP",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "token",
        "outputs": [
          {
            "internalType": "contract MetaheroToken",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "uniswapFactory",
        "outputs": [
          {
            "internalType": "contract IUniswapV2Factory",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "uniswapPair",
        "outputs": [
          {
            "internalType": "contract IUniswapV2Pair",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "uniswapRouter",
        "outputs": [
          {
            "internalType": "contract IUniswapV2Router02",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "stateMutability": "payable",
        "type": "receive"
      }
    ],
    "addresses": {
      "56": "0x5b5331ACAcF9009E8308651A5DE5E7E8e1Bf2373",
      "97": "0x34D3fB5C2528a882d8b202F8b38D833DE4917ea6"
    }
  },
  "MetaheroPresale": {
    "abi": [
      {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "AccountAdded",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "AccountRemoved",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "token",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "tokensAmountPerNative",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "minPurchasePrice",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "maxPurchasePrice",
            "type": "uint256"
          }
        ],
        "name": "Initialized",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "OwnerUpdated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [],
        "name": "PresaleStarted",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "account",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "tokensPrice",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "tokensAmount",
            "type": "uint256"
          }
        ],
        "name": "TokensPurchased",
        "type": "event"
      },
      {
        "inputs": [
          {
            "internalType": "address[]",
            "name": "accounts",
            "type": "address[]"
          }
        ],
        "name": "addAccounts",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "buyTokens",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "finishPresale",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address payable",
            "name": "token_",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "tokensAmountPerNative",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minPurchasePrice",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxPurchasePrice",
            "type": "uint256"
          }
        ],
        "name": "initialize",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "initialized",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address[]",
            "name": "accounts",
            "type": "address[]"
          }
        ],
        "name": "removeAccounts",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "owner_",
            "type": "address"
          }
        ],
        "name": "setOwner",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "settings",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "tokensAmountPerNative",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "minPurchasePrice",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "maxPurchasePrice",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "startPresale",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "started",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "summary",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "totalAccounts",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalTokens",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "syncTotalTokens",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "token",
        "outputs": [
          {
            "internalType": "contract MetaheroToken",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "name": "whitelist",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "stateMutability": "payable",
        "type": "receive"
      }
    ],
    "addresses": {
      "56": "0xFc7C3626F19Bf7751DFCDbd3b8aBA1FF9270C7b7",
      "97": "0xED1c8355808Da214d7208a2d8DBb844BDF74c17C"
    }
  },
  "MetaheroToken": {
    "abi": [
      {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "account",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "bool",
            "name": "excludeSenderFromFee",
            "type": "bool"
          },
          {
            "indexed": false,
            "internalType": "bool",
            "name": "excludeRecipientFromFee",
            "type": "bool"
          }
        ],
        "name": "AccountExcluded",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "spender",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "Approval",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "controller",
            "type": "address"
          }
        ],
        "name": "ControllerUpdated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "dao",
            "type": "address"
          }
        ],
        "name": "DAOUpdated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "sender",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "recipient",
                "type": "uint256"
              }
            ],
            "indexed": false,
            "internalType": "struct MetaheroToken.Fees",
            "name": "burnFees",
            "type": "tuple"
          },
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "sender",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "recipient",
                "type": "uint256"
              }
            ],
            "indexed": false,
            "internalType": "struct MetaheroToken.Fees",
            "name": "lpFees",
            "type": "tuple"
          },
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "sender",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "recipient",
                "type": "uint256"
              }
            ],
            "indexed": false,
            "internalType": "struct MetaheroToken.Fees",
            "name": "rewardsFees",
            "type": "tuple"
          }
        ],
        "name": "FeesUpdated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "sender",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "recipient",
                "type": "uint256"
              }
            ],
            "indexed": false,
            "internalType": "struct MetaheroToken.Fees",
            "name": "burnFees",
            "type": "tuple"
          },
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "sender",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "recipient",
                "type": "uint256"
              }
            ],
            "indexed": false,
            "internalType": "struct MetaheroToken.Fees",
            "name": "lpFees",
            "type": "tuple"
          },
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "sender",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "recipient",
                "type": "uint256"
              }
            ],
            "indexed": false,
            "internalType": "struct MetaheroToken.Fees",
            "name": "rewardsFees",
            "type": "tuple"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "minTotalSupply",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "lpm",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "controller",
            "type": "address"
          }
        ],
        "name": "Initialized",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "address",
            "name": "owner",
            "type": "address"
          }
        ],
        "name": "OwnerUpdated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [],
        "name": "PresaleFinished",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "totalRewards",
            "type": "uint256"
          }
        ],
        "name": "TotalRewardsUpdated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": true,
            "internalType": "address",
            "name": "from",
            "type": "address"
          },
          {
            "indexed": true,
            "internalType": "address",
            "name": "to",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "value",
            "type": "uint256"
          }
        ],
        "name": "Transfer",
        "type": "event"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "owner",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "spender",
            "type": "address"
          }
        ],
        "name": "allowance",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "spender",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "approve",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "balanceOf",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "result",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "burn",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "sender",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "burnFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "controller",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "dao",
        "outputs": [
          {
            "internalType": "contract IMetaheroDAO",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "decimals",
        "outputs": [
          {
            "internalType": "uint8",
            "name": "",
            "type": "uint8"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          },
          {
            "internalType": "bool",
            "name": "excludeSenderFromFee",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "excludeRecipientFromFee",
            "type": "bool"
          }
        ],
        "name": "excludeAccount",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "getBalanceSummary",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "totalBalance",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "holdingBalance",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalRewards",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "account",
            "type": "address"
          }
        ],
        "name": "getExcludedAccount",
        "outputs": [
          {
            "internalType": "bool",
            "name": "exists",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "excludeSenderFromFee",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "excludeRecipientFromFee",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "sender",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "recipient",
                "type": "uint256"
              }
            ],
            "internalType": "struct MetaheroToken.Fees",
            "name": "burnFees",
            "type": "tuple"
          },
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "sender",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "recipient",
                "type": "uint256"
              }
            ],
            "internalType": "struct MetaheroToken.Fees",
            "name": "lpFees",
            "type": "tuple"
          },
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "sender",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "recipient",
                "type": "uint256"
              }
            ],
            "internalType": "struct MetaheroToken.Fees",
            "name": "rewardsFees",
            "type": "tuple"
          },
          {
            "internalType": "uint256",
            "name": "minTotalSupply",
            "type": "uint256"
          },
          {
            "internalType": "address payable",
            "name": "lpm_",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "controller_",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "totalSupply_",
            "type": "uint256"
          },
          {
            "internalType": "address[]",
            "name": "excludedAccounts_",
            "type": "address[]"
          }
        ],
        "name": "initialize",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "initialized",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "lpm",
        "outputs": [
          {
            "internalType": "contract MetaheroLPM",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "recipient",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "mintTo",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "name",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "owner",
        "outputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "presaleFinished",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "dao_",
            "type": "address"
          }
        ],
        "name": "setDAO",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "owner_",
            "type": "address"
          }
        ],
        "name": "setOwner",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "setPresaleAsFinished",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "settings",
        "outputs": [
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "sender",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "recipient",
                "type": "uint256"
              }
            ],
            "internalType": "struct MetaheroToken.Fees",
            "name": "burnFees",
            "type": "tuple"
          },
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "sender",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "recipient",
                "type": "uint256"
              }
            ],
            "internalType": "struct MetaheroToken.Fees",
            "name": "lpFees",
            "type": "tuple"
          },
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "sender",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "recipient",
                "type": "uint256"
              }
            ],
            "internalType": "struct MetaheroToken.Fees",
            "name": "rewardsFees",
            "type": "tuple"
          },
          {
            "internalType": "uint256",
            "name": "minTotalSupply",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "summary",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "totalExcluded",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalHolding",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalRewards",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalSupply",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "symbol",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "recipient",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "transfer",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "sender",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "recipient",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "name": "transferFrom",
        "outputs": [
          {
            "internalType": "bool",
            "name": "",
            "type": "bool"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "sender",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "recipient",
                "type": "uint256"
              }
            ],
            "internalType": "struct MetaheroToken.Fees",
            "name": "burnFees",
            "type": "tuple"
          },
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "sender",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "recipient",
                "type": "uint256"
              }
            ],
            "internalType": "struct MetaheroToken.Fees",
            "name": "lpFees",
            "type": "tuple"
          },
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "sender",
                "type": "uint256"
              },
              {
                "internalType": "uint256",
                "name": "recipient",
                "type": "uint256"
              }
            ],
            "internalType": "struct MetaheroToken.Fees",
            "name": "rewardsFees",
            "type": "tuple"
          }
        ],
        "name": "updateFees",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ],
    "addresses": {
      "56": "0x054053c9C728F56639eC91F3a92b590BAF0b02Ff",
      "97": "0xF5353e1dF6d302dE915B36981F101061b91c8b79"
    }
  }
};
