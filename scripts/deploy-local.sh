#!/bin/bash

WORKING_DIR="`dirname \"$0\"`"
PACKAGES_PATH="`cd "${WORKING_DIR}/../packages"; pwd`"

cd ${PACKAGES_PATH}/token
npm run deploy:local --  --reset

cd ${PACKAGES_PATH}/helper
npm run deploy:local --  --reset

cd ${PACKAGES_PATH}/loyalty
npm run deploy:local --  --reset

