#!/usr/bin/env bash
ORIGINAL_DIR=$PWD
THIS_DIR=$(dirname $0)
cd $THIS_DIR
rm -v ../test-project/packages/*/*.tgz
cd $ORIGINAL
