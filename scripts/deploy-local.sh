#!/bin/bash

WORKING_DIR="`dirname \"$0\"`"
PACKAGES_PATH="`cd "${WORKING_DIR}/../packages"; pwd`"

deploy-local()
{
    cd ${PACKAGES_PATH}/${1}
    npm run deploy -- --network local --reset
}

deploy-local token
deploy-local helper
deploy-local loyalty

