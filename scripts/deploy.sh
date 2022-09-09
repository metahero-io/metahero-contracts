#!/bin/bash

WORKING_DIR="`dirname \"$0\"`"
PACKAGES_PATH="`cd "${WORKING_DIR}/../packages"; pwd`"
NETWORK="${1}"

run-deploy()
{
    cd ${PACKAGES_PATH}/${1}
    npm run deploy -- --network ${NETWORK}
}

run-deploy-reset()
{
    cd ${PACKAGES_PATH}/${1}
    npm run deploy -- --network ${NETWORK} --reset
}

run-deploy-known-contracts-only()
{
    cd ${PACKAGES_PATH}/${1}
    npm run deploy -- --network ${NETWORK} --known-contracts-only true
}

case ${NETWORK} in
  bnb)
    run-deploy-known-contracts-only token
    ;;
  bnb-test)
    run-deploy-known-contracts-only token
    ;;
  local)
    run-deploy-reset token
    run-deploy-reset helper
    run-deploy-reset loyalty
    ;;
esac




