#!/bin/bash

WORKING_DIR="`dirname \"$0\"`"
ROOT_PATH="`cd "${WORKING_DIR}/.."; pwd`"

cd ${ROOT_PATH}

npm run hardhat -- token-distributor:add-invitation \
  --network local \
  --invitation-id 1 \
  --tree-root "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" \
  --deposit-power 1 \
  --min-deposit "100" \
  --max-deposit "100000" \
  --min-rewards-apy 5 \
  --max-rewards-apy 10 \
  --min-withdrawal-lock-time 60 \
  --max-withdrawal-lock-time 3600

npm run hardhat -- token-distributor:add-invitation \
  --network local \
  --invitation-id 2 \
  --tree-root "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" \
  --deposit-power 2 \
  --min-deposit "200" \
  --max-deposit "200000" \
  --min-rewards-apy 5 \
  --max-rewards-apy 10 \
  --min-withdrawal-lock-time 60 \
  --max-withdrawal-lock-time 3600

npm run hardhat -- token-distributor:add-invitation \
  --network local \
  --invitation-id 3 \
  --tree-root "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" \
  --deposit-power 3 \
  --min-deposit "300" \
  --max-deposit "300000" \
  --min-rewards-apy 5 \
  --max-rewards-apy 10 \
  --min-withdrawal-lock-time 60 \
  --max-withdrawal-lock-time 3600

npm run hardhat -- token-distributor:remove-invitation \
  --network local \
  --invitation-id 3

npm run hardhat -- token-distributor:set-rewards  \
  --network local \
  --amount "300000"