#!/usr/bin/env node

const program = require('commander');
const process = require('process');
const Pckr = require('pckr');

program
  .command('install')
  .action(function () {
    const pckr = new Pckr(process.cwd());
    pckr.install();
  });

program
  .command('pack')
  .action(function () {
    const pckr = new Pckr(process.cwd());
    pckr.pack();
  });

program.parse(process.argv);
