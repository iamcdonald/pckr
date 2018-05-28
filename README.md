# pckr [![Build Status](https://travis-ci.org/iamcdonald/pckr.svg?branch=master)](https://travis-ci.org/iamcdonald/pckr) [![Coverage Status](https://coveralls.io/repos/iamcdonald/pckr/badge.svg?branch=master&service=github)](https://coveralls.io/github/iamcdonald/pckr?branch=master)

A module to allow to packaging up a module along with symlinked dependencies so that the module could be re-installed in another context (docker container, another machine etc.).

## Install

```sh
$ npm install pckr
```

## Command Line
```sh
pckr pack     //packs current module
pckr install  //install module symlinked dependencies 
```
