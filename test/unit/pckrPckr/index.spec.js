const test = require('ava');
const td = require('testdouble');
const process = require('process');

const setup = () => {
  const stubs = {
    fs: td.replace('fs'),
    path: td.replace('path'),
    npm: td.replace('../../../src/npm', {
      pack: td.function()
    })
  };

  stubs.npm.load = td.function();

  const pckrPckr = require('../../../src/pckrPckr');

  return { stubs, pckrPckr };
};

const teardown = () => {
  td.reset()
};

test.beforeEach(t => {
  t.context = setup();
});

test.afterEach.always(teardown);

test('pckrPckr - pack - packs pckr', t => {
  t.plan(0);
  const {stubs, pckrPckr } = t.context;
  const pckrPath = 'a/pckr/path';
  td.when(stubs.path.resolve(td.matchers.isA(String), '../../')).thenReturn(pckrPath);
  pckrPckr.pack();
  td.verify(stubs.npm.pack(pckrPath));
});

test('pckrPckr - remove - remove pckr from packed location', t => {
  t.plan(0);
  const {stubs, pckrPckr } = t.context;
  const pckrPath = 'a/pckr/path';
  const packedName = 'pckr-0.0.0.tgz';
  const packedPath = 'a/pckr/path/pckr-0.0.0.tgz';
  td.when(stubs.path.resolve(td.matchers.isA(String), '../../')).thenReturn(pckrPath);
  td.when(stubs.npm.pack(pckrPath)).thenReturn(packedName);
  td.when(stubs.path.resolve(pckrPath, packedName)).thenReturn(packedPath);
  pckrPckr.pack();
  pckrPckr.remove();
  td.verify(stubs.fs.unlinkSync(packedPath));
});

test('pckrPckr - getPath - returns pckr packed location', t => {
  const {stubs, pckrPckr } = t.context;
  const pckrPath = 'a/pckr/path';
  const packedName = 'pckr-0.0.0.tgz';
  const packedPath = 'a/pckr/path/pckr-0.0.0.tgz';
  td.when(stubs.path.resolve(td.matchers.isA(String), '../../')).thenReturn(pckrPath);
  td.when(stubs.npm.pack(pckrPath)).thenReturn(packedName);
  td.when(stubs.path.resolve(pckrPath, packedName)).thenReturn(packedPath);
  pckrPckr.pack();
  t.is(pckrPckr.getPath(), packedPath);
});
