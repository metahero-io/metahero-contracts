#!/bin/bash

WORKING_DIR="`dirname \"$0\"`"
PACKAGES_PATH="`cd "${WORKING_DIR}/../packages"; pwd`"
NETWORK="${1}"

deploy()
{
    cd ${PACKAGES_PATH}/${1}
    npm run deploy -- --network ${NETWORK}
}

deploy-with-reset()
{
    cd ${PACKAGES_PATH}/${1}
    npm run deploy -- --network ${NETWORK} --reset
}

build-known-contracts()
{
    cd ${PACKAGES_PATH}/${1}
    npm run deploy -- --network ${NETWORK} --known-contracts-only true
}

case ${NETWORK} in
  bnb)
    build-known-contracts token
    ;;
  bnb-test)
    deploy-with-reset token
    deploy-with-reset helper
    deploy-with-reset loyalty
    ;;
  local)
    deploy-with-reset token
    deploy-with-reset helper
    deploy-with-reset loyalty
    ;;
esac




