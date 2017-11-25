const test = require('ava');
const path = require('path');
const process = require('process');
const { exec } = require('child_process');
const fs = require('fs');
const pckr = require('../../src');

const setup = () => {
  exec('./setup.sh', {
    cwd: __dirname
  });
};

const cleanup = () => {
  exec(path.resolve(__dirname, './cleanup.sh'), {
    cwd: process.cwd() 
  });
};

test.before(setup);

test.after.always(cleanup);

test('pack - packs given module and returns path to .tgz', async t => {
  const packedPath = await pckr.pack(path.resolve(__dirname, 'test-project'));
  t.truthy(fs.existsSync(packedPath));
});
