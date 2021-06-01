/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import { Provider, TransactionRequest } from "@ethersproject/providers";
import type { HEROTokenV1, HEROTokenV1Interface } from "../HEROTokenV1";

const _abi = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [],
    name: "Initialized",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "controller",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "uint256",
            name: "sender",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "recipient",
            type: "uint256",
          },
        ],
        internalType: "struct HEROTokenV1.Tax",
        name: "lpTax",
        type: "tuple",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "sender",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "recipient",
            type: "uint256",
          },
        ],
        internalType: "struct HEROTokenV1.Tax",
        name: "rewardsTax",
        type: "tuple",
      },
      {
        internalType: "uint256",
        name: "cycleLength",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "totalSupply_",
        type: "uint256",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "initialized",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "controller_",
        type: "address",
      },
    ],
    name: "setController",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const _bytecode =
  "0x60806040523480156200001157600080fd5b5060405180606001604052806040518060400160405280600881526020017f4d4554414845524f00000000000000000000000000000000000000000000000081525081526020016040518060400160405280600481526020017f4845524f000000000000000000000000000000000000000000000000000000008152508152602001600960ff1681525080600080820151816000019080519060200190620000bb92919062000188565b506020820151816001019080519060200190620000da92919062000188565b5060408201518160020160006101000a81548160ff021916908360ff1602179055509050505033600360006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555033600460006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506200022e565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f10620001cb57805160ff1916838001178555620001fc565b82800160010185558215620001fc579182015b82811115620001fb578251825591602001919060010190620001de565b5b5090506200020b91906200020f565b5090565b5b808211156200022a57600081600090555060010162000210565b5090565b612765806200023e6000396000f3fe608060405234801561001057600080fd5b50600436106100cf5760003560e01c8063313ce5671161008c57806395d89b411161006657806395d89b4114610214578063a9059cbb14610232578063dd62ed3e14610262578063f77c479114610292576100cf565b8063313ce567146101aa57806370a08231146101c857806392eefe9b146101f8576100cf565b806306fdde03146100d4578063095ea7b3146100f2578063158ef93e1461012257806318160ddd146101405780631c7103b11461015e57806323b872dd1461017a575b600080fd5b6100dc6102b0565b6040516100e991906123b0565b60405180910390f35b61010c60048036038101906101079190611c41565b610354565b6040516101199190612395565b60405180910390f35b61012a61036b565b6040516101379190612395565b60405180910390f35b6101486103c3565b6040516101559190612612565b60405180910390f35b61017860048036038101906101739190611c7d565b6103d0565b005b610194600480360381019061018f9190611bf2565b610606565b6040516101a19190612395565b60405180910390f35b6101b2610705565b6040516101bf919061262d565b60405180910390f35b6101e260048036038101906101dd9190611b8d565b61071e565b6040516101ef9190612612565b60405180910390f35b610212600480360381019061020d9190611b8d565b610738565b005b61021c6108d6565b60405161022991906123b0565b60405180910390f35b61024c60048036038101906102479190611c41565b61097b565b6040516102599190612395565b60405180910390f35b61027c60048036038101906102779190611bb6565b610993565b6040516102899190612612565b60405180910390f35b61029a610a1d565b6040516102a7919061237a565b60405180910390f35b6060600080018054600181600116156101000203166002900480601f01602080910402602001604051908101604052809291908181526020018280546001816001161561010002031660029004801561034a5780601f1061031f5761010080835404028352916020019161034a565b820191906000526020600020905b81548152906001019060200180831161032d57829003601f168201915b5050505050905090565b6000610361338484610a43565b6001905092915050565b60008073ffffffffffffffffffffffffffffffffffffffff16600460009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1614905090565b6000600b60070154905090565b600073ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff161415610440576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610437906124d2565b60405180910390fd5b600460009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16146104d0576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016104c790612512565b60405180910390fd5b6000600460006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550426005819055506040518060600160405280858036038101906105359190611ce0565b81526020018480360381019061054b9190611ce0565b81526020016000841461055e5783610563565b620151805b81525060066000820151816000016000820151816000015560208201518160010155505060208201518160020160008201518160000155602082015181600101555050604082015181600401559050506105d433600083146105c557826105cf565b678ac7230489e800005b610c11565b7f5daa87a0e9463431830481fd4b6e3403442dfb9a12b9c07597e9f61d50b633c860405160405180910390a150505050565b6000610613848484610fa5565b91506000601360008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060000160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050828110156106dc576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016106d390612572565b60405180910390fd5b6106f985336106f4868561160190919063ffffffff16565b610a43565b60019150509392505050565b60008060020160009054906101000a900460ff16905090565b60006107318261072c611651565b611697565b9050919050565b600360009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16146107c8576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016107bf90612552565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff16141580156108535750600360009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614155b610892576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161088990612412565b60405180910390fd5b80600360006101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050565b606060006001018054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156109715780601f1061094657610100808354040283529160200191610971565b820191906000526020600020905b81548152906001019060200180831161095457829003601f168201915b5050505050905090565b6000610988338484610fa5565b506001905092915050565b6000601360008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060000160008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905092915050565b600360009054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff161415610ab3576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610aaa906124b2565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415610b23576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610b1a906125d2565b60405180910390fd5b80601360008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060000160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92583604051610c049190612612565b60405180910390a3505050565b600460149054906101000a900460ff1615610c61576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610c58906125b2565b60405180910390fd5b6001600460146101000a81548160ff021916908315150217905550600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff161415610cec576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610ce390612452565b60405180910390fd5b60008111610d2f576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610d26906123f2565b60405180910390fd5b6000601360008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060010154148015610dc357506000601360008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060020154145b610e02576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610df990612472565b60405180910390fd5b610e1a81600b600701546117ab90919063ffffffff16565b600b6007018190555080601360008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600101819055506001601360008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060030160006101000a81548160ff0219169083151502179055506001601360008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060030160016101000a81548160ff0219169083151502179055508173ffffffffffffffffffffffffffffffffffffffff16600073ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef83604051610f7e9190612612565b60405180910390a36000600460146101000a81548160ff0219169083151502179055505050565b6000600460149054906101000a900460ff1615610ff7576040517f08c379a0000000000000000000000000000000000000000000000000000000008152600401610fee906125b2565b60405180910390fd5b6001600460146101000a81548160ff021916908315150217905550600073ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff161415611082576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161107990612432565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1614156110f2576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016110e990612532565b60405180910390fd5b6000821415611136576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161112d906123f2565b60405180910390fd5b6000611140611651565b9050600061114e8683611697565b90506000806000806000601360008c73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060030160009054906101000a900460ff16611255576000600660000160000154146111f7576111ee64174876e8006111e06006600001600001548c61180090919063ffffffff16565b61187090919063ffffffff16565b94508491508493505b6000600660020160000154146112545761123964174876e80061122b6006600201600001548c61180090919063ffffffff16565b61187090919063ffffffff16565b945061124e85836117ab90919063ffffffff16565b91508492505b5b601360008b73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060030160009054906101000a900460ff1661137657600060066000016001015414611306576112eb64174876e8006112dd6006600001600101548c61180090919063ffffffff16565b61187090919063ffffffff16565b945084905061130385856117ab90919063ffffffff16565b93505b6000600660020160010154146113755761134864174876e80061133a6006600201600101548c61180090919063ffffffff16565b61187090919063ffffffff16565b945061135d85826117ab90919063ffffffff16565b905061137285846117ab90919063ffffffff16565b92505b5b600061138b838b6117ab90919063ffffffff16565b9050808710156113d0576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016113c790612492565b60405180910390fd5b6113e885600b600401546117ab90919063ffffffff16565b600b6004018190555061140984600b600201546117ab90919063ffffffff16565b600b6002018190555061142a84600b600201546117ab90919063ffffffff16565b600b6005018190555087600b60000154141561144f5787600b6000018190555061145a565b87600b600001819055505b61146d818861160190919063ffffffff16565b601360008e73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060010181905550611529600083146114d6576114d1838c6117ab90919063ffffffff16565b6114d8565b8a5b601360008e73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600101546117ab90919063ffffffff16565b601360008d73ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600101819055508a73ffffffffffffffffffffffffffffffffffffffff168c73ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8c6040516115cc9190612612565b60405180910390a389985050505050505050506000600460146101000a81548160ff0219169083151502179055509392505050565b600082821115611646576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161163d906125f2565b60405180910390fd5b818303905092915050565b600061169260016116846006600401546116766005544261160190919063ffffffff16565b61187090919063ffffffff16565b6117ab90919063ffffffff16565b905090565b6000601360008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600101549050601360008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060030160019054906101000a900460ff1615801561173b5750600081115b156117a557600061174c84846118c6565b9050600081146117a357600061176184611a7c565b905061179f6117908261178285600b6002015461180090919063ffffffff16565b61187090919063ffffffff16565b846117ab90919063ffffffff16565b9250505b505b92915050565b6000808284019050838110156117f6576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016117ed906124f2565b60405180910390fd5b8091505092915050565b600080831415611813576000905061186a565b600082840290508284828161182457fe5b0414611865576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161185c906123d2565b60405180910390fd5b809150505b92915050565b60008082116118b4576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016118ab90612592565b60405180910390fd5b8183816118bd57fe5b04905092915050565b6000601360008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060030160019054906101000a900460ff1615801561196857506000601360008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206001015414155b80156119b5575081601360008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060020154115b15611a76576000611a11601360008673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600201548461160190919063ffffffff16565b90506000811115611a7457611a7181601360008773ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000206001015461180090919063ffffffff16565b91505b505b92915050565b6000600b6005015490506000600b60060154118015611a9f575081600b60000154115b15611af7576000611abe600b600001548461160190919063ffffffff16565b905060008114611af557611af2611ae382600b6006015461180090919063ffffffff16565b836117ab90919063ffffffff16565b91505b505b919050565b600081359050611b0b8161272a565b92915050565b600060408284031215611b2357600080fd5b81905092915050565b600060408284031215611b3e57600080fd5b611b486040612648565b90506000611b5884828501611b78565b6000830152506020611b6c84828501611b78565b60208301525092915050565b600081359050611b8781612741565b92915050565b600060208284031215611b9f57600080fd5b6000611bad84828501611afc565b91505092915050565b60008060408385031215611bc957600080fd5b6000611bd785828601611afc565b9250506020611be885828601611afc565b9150509250929050565b600080600060608486031215611c0757600080fd5b6000611c1586828701611afc565b9350506020611c2686828701611afc565b9250506040611c3786828701611b78565b9150509250925092565b60008060408385031215611c5457600080fd5b6000611c6285828601611afc565b9250506020611c7385828601611b78565b9150509250929050565b60008060008060c08587031215611c9357600080fd5b6000611ca187828801611b11565b9450506040611cb287828801611b11565b9350506080611cc387828801611b78565b92505060a0611cd487828801611b78565b91505092959194509250565b600060408284031215611cf257600080fd5b6000611d0084828501611b2c565b91505092915050565b611d1281612691565b82525050565b611d21816126a3565b82525050565b6000611d3282612675565b611d3c8185612680565b9350611d4c8185602086016126e6565b611d5581612719565b840191505092915050565b6000611d6d601d83612680565b91507f4d6174683a206d756c7469706c69636174696f6e206f766572666c6f770000006000830152602082019050919050565b6000611dad601983612680565b91507f4845524f546f6b656e3a20696e76616c696420616d6f756e74000000000000006000830152602082019050919050565b6000611ded601e83612680565b91507f436f6e74726f6c6c65643a20696e76616c696420636f6e74726f6c6c657200006000830152602082019050919050565b6000611e2d602983612680565b91507f4845524f546f6b656e3a207472616e736665722066726f6d20746865207a657260008301527f6f206164647265737300000000000000000000000000000000000000000000006020830152604082019050919050565b6000611e93602183612680565b91507f4845524f546f6b656e3a20696e76616c696420686f6c6465722061646472657360008301527f73000000000000000000000000000000000000000000000000000000000000006020830152604082019050919050565b6000611ef9602083612680565b91507f4845524f546f6b656e3a20686f6c64657220616c7265616479206578697374736000830152602082019050919050565b6000611f39602a83612680565b91507f4845524f546f6b656e3a207472616e7366657220616d6f756e7420657863656560008301527f64732062616c616e6365000000000000000000000000000000000000000000006020830152604082019050919050565b6000611f9f602883612680565b91507f4845524f546f6b656e3a20617070726f76652066726f6d20746865207a65726f60008301527f20616464726573730000000000000000000000000000000000000000000000006020830152604082019050919050565b6000612005602283612680565b91507f496e697469616c697a61626c653a20616c726561647920696e697469616c697a60008301527f65640000000000000000000000000000000000000000000000000000000000006020830152604082019050919050565b600061206b601783612680565b91507f4d6174683a206164646974696f6e206f766572666c6f770000000000000000006000830152602082019050919050565b60006120ab603083612680565b91507f496e697469616c697a61626c653a206d73672e73656e646572206973206e6f7460008301527f2074686520696e697469616c697a6572000000000000000000000000000000006020830152604082019050919050565b6000612111602783612680565b91507f4845524f546f6b656e3a207472616e7366657220746f20746865207a65726f2060008301527f61646472657373000000000000000000000000000000000000000000000000006020830152604082019050919050565b6000612177602c83612680565b91507f436f6e74726f6c6c65643a206d73672e73656e646572206973206e6f7420746860008301527f6520636f6e74726f6c6c657200000000000000000000000000000000000000006020830152604082019050919050565b60006121dd602c83612680565b91507f4845524f546f6b656e3a207472616e7366657220616d6f756e7420657863656560008301527f647320616c6c6f77616e636500000000000000000000000000000000000000006020830152604082019050919050565b6000612243601683612680565b91507f4d6174683a206469766973696f6e206279207a65726f000000000000000000006000830152602082019050919050565b6000612283601083612680565b91507f4c6f636b61626c653a206c6f636b6564000000000000000000000000000000006000830152602082019050919050565b60006122c3602683612680565b91507f4845524f546f6b656e3a20617070726f766520746f20746865207a65726f206160008301527f64647265737300000000000000000000000000000000000000000000000000006020830152604082019050919050565b6000612329601a83612680565b91507f4d6174683a207375627472616374696f6e206f766572666c6f770000000000006000830152602082019050919050565b612365816126cf565b82525050565b612374816126d9565b82525050565b600060208201905061238f6000830184611d09565b92915050565b60006020820190506123aa6000830184611d18565b92915050565b600060208201905081810360008301526123ca8184611d27565b905092915050565b600060208201905081810360008301526123eb81611d60565b9050919050565b6000602082019050818103600083015261240b81611da0565b9050919050565b6000602082019050818103600083015261242b81611de0565b9050919050565b6000602082019050818103600083015261244b81611e20565b9050919050565b6000602082019050818103600083015261246b81611e86565b9050919050565b6000602082019050818103600083015261248b81611eec565b9050919050565b600060208201905081810360008301526124ab81611f2c565b9050919050565b600060208201905081810360008301526124cb81611f92565b9050919050565b600060208201905081810360008301526124eb81611ff8565b9050919050565b6000602082019050818103600083015261250b8161205e565b9050919050565b6000602082019050818103600083015261252b8161209e565b9050919050565b6000602082019050818103600083015261254b81612104565b9050919050565b6000602082019050818103600083015261256b8161216a565b9050919050565b6000602082019050818103600083015261258b816121d0565b9050919050565b600060208201905081810360008301526125ab81612236565b9050919050565b600060208201905081810360008301526125cb81612276565b9050919050565b600060208201905081810360008301526125eb816122b6565b9050919050565b6000602082019050818103600083015261260b8161231c565b9050919050565b6000602082019050612627600083018461235c565b92915050565b6000602082019050612642600083018461236b565b92915050565b6000604051905081810181811067ffffffffffffffff8211171561266b57600080fd5b8060405250919050565b600081519050919050565b600082825260208201905092915050565b600061269c826126af565b9050919050565b60008115159050919050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000819050919050565b600060ff82169050919050565b60005b838110156127045780820151818401526020810190506126e9565b83811115612713576000848401525b50505050565b6000601f19601f8301169050919050565b61273381612691565b811461273e57600080fd5b50565b61274a816126cf565b811461275557600080fd5b5056fea164736f6c634300060c000a";

export class HEROTokenV1__factory extends ContractFactory {
  constructor(signer?: Signer) {
    super(_abi, _bytecode, signer);
  }

  deploy(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<HEROTokenV1> {
    return super.deploy(overrides || {}) as Promise<HEROTokenV1>;
  }
  getDeployTransaction(
    overrides?: Overrides & { from?: string | Promise<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  attach(address: string): HEROTokenV1 {
    return super.attach(address) as HEROTokenV1;
  }
  connect(signer: Signer): HEROTokenV1__factory {
    return super.connect(signer) as HEROTokenV1__factory;
  }
  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): HEROTokenV1Interface {
    return new utils.Interface(_abi) as HEROTokenV1Interface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): HEROTokenV1 {
    return new Contract(address, _abi, signerOrProvider) as HEROTokenV1;
  }
}
