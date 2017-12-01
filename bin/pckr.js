#!/usr/bin/env node

const program = require('commander');
const process = require('process');
const Pckr = require('pckr');

program
  .command('install')
  .action(async function (opts) {
    const pckr = new Pckr(process.cwd());
    await pckr.install();
  });

program.parse(process.argv);
