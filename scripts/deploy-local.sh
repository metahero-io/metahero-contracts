#!/bin/bash

WORKING_DIR="`dirname \"$0\"`"
PACKAGES_PATH="`cd "${WORKING_DIR}/../packages"; pwd`"

run-deploy()
{
    cd ${PACKAGES_PATH}/${1}
    npm run deploy -- --network local --reset
}

run-deploy token
run-deploy helper
run-deploy loyalty
