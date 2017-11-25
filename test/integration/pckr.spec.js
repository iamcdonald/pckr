const test = require('ava');
const path = require('path');
const fs = require('fs');
const pckr = require('../../src');

test('pack - packs given module and returns path to .tgz', async t => {
  const packedPath = await pckr.pack(path.resolve(__dirname, 'test-project'));
  const packageExists = fs.existsSync(packedPath);
  t.truthy(packageExists);
});
