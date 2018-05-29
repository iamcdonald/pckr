#!/usr/bin/env bash
ORIGINAL_DIR=$PWD
THIS_DIR=$(dirname $0)
cd $THIS_DIR
rm -v ../test-project/packages/*/*.tgz
rm -v -r ../test-project/node_modules
rm -v -r ../test-project/packages/*/node_modules
cd $ORIGINAL
