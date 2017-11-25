const test = require('ava');
const td = require('testdouble');


const setup = () => {
  const stubs = {
    npm: td.replace('npm', {
      load: td.function(),
      pack: td.function()
    }),
    process: td.replace('process', {
      cwd: td.function()
    }),
    path: td.replace('path', {
      resolve: (b, r) => `${b}/${r}`
    })
  };
  const testee = require('../../../src/npm/index');
  return { stubs, testee };
};

const teardown = () => {
  td.reset();
};

const setupHappyPath = context => {
  const { stubs } = context;
  const constants = {
    base: '/base',
    packagePath: '../a/path/l',
    packedResult: 'a-thing-0.1.3.tgz',
    defaultPackedResult: 'default-0.0.0.tgz'
  };
  td.when(stubs.process.cwd()).thenReturn(constants.base);
  td.when(stubs.npm.load()).thenCallback(null);
  td.when(stubs.npm.pack('.')).thenCallback(null, [constants.packedResult]);
  td.when(stubs.npm.pack(constants.packagePath)).thenCallback(null, [constants.packedResult]);

  return Object.assign({}, context, { constants });
};

test.beforeEach(t => {
  t.context = setup();
  t.context = setupHappyPath(t.context);
});

test.afterEach.always(teardown);


test('pack - bails if load fails', async t => {
  const { stubs, testee } = t.context;
  const error = new Error('Load Died');
  td.when(stubs.npm.load()).thenCallback(error);
  try {
    await testee.pack();
  } catch (e) {
    t.is(e, error);
  }
});

test('pack - bails if pack fails', async t => {
  const { stubs, testee } = t.context;
  const error = new Error('Pack Died');
  td.when(stubs.npm.pack('.')).thenCallback(error);
  try {
    await testee.pack();
  } catch (e) {
    t.is(e, error);
  }
});

test('pack - packs default path if none provided', async t => {
  const { stubs, testee, constants } = t.context;
  t.is(await testee.pack(), `${constants.base}/${constants.packedResult}`);
});

test('pack - packs chosen package if path provided', async t => {
  const { testee, constants } = t.context;
  t.is(await testee.pack(constants.packagePath), `${constants.base}/${constants.packedResult}`);
});

