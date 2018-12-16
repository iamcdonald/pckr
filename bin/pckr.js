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
  .option('-p, --production', 'Only install production dependencies')
  .action(function (cmd) {
    const pckr = new Pckr(process.cwd(), {
      production: cmd.production
    });
    pckr.pack();
  });

program.parse(process.argv);
