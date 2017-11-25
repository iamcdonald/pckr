#!/usr/bin/env bash
ORIGINAL_DIR=$PWD
THIS_DIR=$(dirname $0)

cd $THIS_DIR/test-project
npm install && npm run bootstrap
cd $ORIGINAL_DIR
