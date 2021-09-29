/* eslint-disable */

module.exports = {
  "MetaheroAirdrop": {
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
            "internalType": "address",
            "name": "token",
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
        "inputs": [
          {
            "internalType": "address[]",
            "name": "recipients",
            "type": "address[]"
          },
          {
            "internalType": "uint256[]",
            "name": "amounts",
            "type": "uint256[]"
          }
        ],
        "name": "batchTransfer",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "c__0x19aa7d0b",
            "type": "bytes32"
          }
        ],
        "name": "c_0x19aa7d0b",
        "outputs": [],
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "c__0x6e1db2e1",
            "type": "bytes32"
          }
        ],
        "name": "c_0x6e1db2e1",
        "outputs": [],
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "c__0x8897423d",
            "type": "bytes32"
          }
        ],
        "name": "c_0x8897423d",
        "outputs": [],
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "token_",
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
      }
    ],
    "addresses": {
      "56": "0x17253eB7026ADB00E1B7E9015e15DCca1790C741",
      "97": "0x0C3F5d746f192205A6b7ef6501e39b319B49C18f"
    }
  },
  "MetaheroDAO": {
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
            "internalType": "address",
            "name": "token",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "operator",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "minVotingPeriod",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "snapshotWindow",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "snapshotBaseTimestamp",
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
            "internalType": "uint256",
            "name": "proposalId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "snapshotId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "bytes",
            "name": "callData",
            "type": "bytes"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "startsAt",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "endsAt",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "votesMinPercentage",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "votesMinWeight",
            "type": "uint256"
          }
        ],
        "name": "ProposalCreated",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "proposalId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "votesYesWeight",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "votesNoWeight",
            "type": "uint256"
          }
        ],
        "name": "ProposalProcessed",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "internalType": "uint256",
            "name": "proposalId",
            "type": "uint256"
          },
          {
            "indexed": false,
            "internalType": "address",
            "name": "member",
            "type": "address"
          },
          {
            "indexed": false,
            "internalType": "uint8",
            "name": "vote",
            "type": "uint8"
          }
        ],
        "name": "VoteSubmitted",
        "type": "event"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "c__0x6e1db2e1",
            "type": "bytes32"
          }
        ],
        "name": "c_0x6e1db2e1",
        "outputs": [],
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "c__0xe54017f8",
            "type": "bytes32"
          }
        ],
        "name": "c_0xe54017f8",
        "outputs": [],
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes",
            "name": "callData",
            "type": "bytes"
          },
          {
            "internalType": "uint256",
            "name": "startsIn",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "endsIn",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "votesMinPercentage",
            "type": "uint256"
          }
        ],
        "name": "createProposal",
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
        "name": "excludeTokenAccount",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "member",
            "type": "address"
          }
        ],
        "name": "getCurrentMemberWeight",
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
        "inputs": [],
        "name": "getCurrentSnapshotId",
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
        "inputs": [],
        "name": "getCurrentTotalWeight",
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
            "name": "member",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "proposalId",
            "type": "uint256"
          }
        ],
        "name": "getMemberProposalVote",
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
            "name": "member",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "snapshotId",
            "type": "uint256"
          }
        ],
        "name": "getMemberWeightOnSnapshot",
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
            "internalType": "uint256",
            "name": "proposalId",
            "type": "uint256"
          }
        ],
        "name": "getProposal",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "snapshotId",
            "type": "uint256"
          },
          {
            "internalType": "bytes",
            "name": "callData",
            "type": "bytes"
          },
          {
            "internalType": "uint256",
            "name": "startsAt",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "endsAt",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "processed",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "votesMinPercentage",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "votesMinWeight",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "votesYesWeight",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "votesNoWeight",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "votesCount",
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
            "name": "timestamp",
            "type": "uint256"
          }
        ],
        "name": "getSnapshotIdAt",
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
            "internalType": "uint256",
            "name": "snapshotId",
            "type": "uint256"
          }
        ],
        "name": "getTotalWeightOnSnapshot",
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
            "name": "token_",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "operator_",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "minVotingPeriod",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "snapshotWindow",
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
        "name": "operator",
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
            "internalType": "uint256",
            "name": "proposalId",
            "type": "uint256"
          }
        ],
        "name": "processProposal",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "removeTokenLPFees",
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
            "name": "minVotingPeriod",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "snapshotWindow",
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
            "name": "proposalId",
            "type": "uint256"
          },
          {
            "internalType": "uint8",
            "name": "vote",
            "type": "uint8"
          }
        ],
        "name": "submitVote",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "member",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "memberWeight",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalWeight",
            "type": "uint256"
          }
        ],
        "name": "syncMember",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "memberA",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "memberAWeight",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "memberB",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "memberBWeight",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalWeight",
            "type": "uint256"
          }
        ],
        "name": "syncMembers",
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
      }
    ],
    "addresses": {
      "56": "0x8369Feb2198D01a2ed5d78E89ca7507983028B42",
      "97": "0xA7f1e243109394E739Fbc72959561ce99f308d9C"
    }
  },
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
            "internalType": "bytes32",
            "name": "c__0x6e1db2e1",
            "type": "bytes32"
          }
        ],
        "name": "c_0x6e1db2e1",
        "outputs": [],
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "c__0x8897423d",
            "type": "bytes32"
          }
        ],
        "name": "c_0x8897423d",
        "outputs": [],
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "c__0x90173b82",
            "type": "bytes32"
          }
        ],
        "name": "c_0x90173b82",
        "outputs": [],
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "c__0xd2aa0e28",
            "type": "bytes32"
          }
        ],
        "name": "c_0xd2aa0e28",
        "outputs": [],
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "c__0xfe89a781",
            "type": "bytes32"
          }
        ],
        "name": "c_0xfe89a781",
        "outputs": [],
        "stateMutability": "pure",
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
      "56": "0x5DA5b71B88C42544b642D4AB781B30831EDAC341",
      "97": null
    }
  },
  "MetaheroSwapHelper": {
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
            "internalType": "address",
            "name": "token",
            "type": "address"
          }
        ],
        "name": "Initialized",
        "type": "event"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "c__0x48876e53",
            "type": "bytes32"
          }
        ],
        "name": "c_0x48876e53",
        "outputs": [],
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "c__0x6e1db2e1",
            "type": "bytes32"
          }
        ],
        "name": "c_0x6e1db2e1",
        "outputs": [],
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address payable",
            "name": "account",
            "type": "address"
          },
          {
            "internalType": "address[]",
            "name": "tokens",
            "type": "address[]"
          },
          {
            "internalType": "address[]",
            "name": "spenders",
            "type": "address[]"
          }
        ],
        "name": "getAllowances",
        "outputs": [
          {
            "internalType": "uint256[]",
            "name": "result",
            "type": "uint256[]"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address payable",
            "name": "account",
            "type": "address"
          },
          {
            "internalType": "address[]",
            "name": "tokens",
            "type": "address[]"
          }
        ],
        "name": "getBalances",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "nativeBalance",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "tokenHoldingBalance",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "tokenTotalRewards",
            "type": "uint256"
          },
          {
            "internalType": "uint256[]",
            "name": "tokensBalances",
            "type": "uint256[]"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "token_",
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
      }
    ],
    "addresses": {
      "56": "0xD853461e96BCe6c66513e0EDD56eE1d9B56DdB2D",
      "97": "0x91A7347B72e9AAE5942814C47a385100E2b9904C"
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
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "c__0x6e1db2e1",
            "type": "bytes32"
          }
        ],
        "name": "c_0x6e1db2e1",
        "outputs": [],
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "c__0x8858438c",
            "type": "bytes32"
          }
        ],
        "name": "c_0x8858438c",
        "outputs": [],
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "c__0x8897423d",
            "type": "bytes32"
          }
        ],
        "name": "c_0x8897423d",
        "outputs": [],
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "c__0xd042b2c9",
            "type": "bytes32"
          }
        ],
        "name": "c_0xd042b2c9",
        "outputs": [],
        "stateMutability": "pure",
        "type": "function"
      },
      {
        "inputs": [
          {
            "internalType": "bytes32",
            "name": "c__0xe71ef217",
            "type": "bytes32"
          }
        ],
        "name": "c_0xe71ef217",
        "outputs": [],
        "stateMutability": "pure",
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
      "56": "0xD40bEDb44C081D2935eebA6eF5a3c8A31A1bBE13",
      "97": "0xDA9fCA16FeCb61F84BA65A096bCEd97c902Dad56"
    }
  }
};
