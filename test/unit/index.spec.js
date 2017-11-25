const test = require('ava');
const td = require('testdouble');

const setup = () => {
  const stubs = {
    npm: td.replace('../../src/npm')
  };
  const testee = require('../../src/index');
  return { stubs, testee };
};

const teardown = () => {
  td.reset();
};

const baseScenario = context => {
  const { stubs } = context;
  const constants = {
    packagePath: '../../a/path/to/a/place',
    packedResult: 'packed-0.1.0.tgz',
  };
  td.when(stubs.npm.pack(constants.packagePath)).thenResolve(constants.packedResult);
  return Object.assign({}, context, { constants });
};

test.beforeEach(t => {
  t.context = setup();
  t.context = baseScenario(t.context);
});

test.afterEach.always(() => {
  teardown();
});

test('pack - rejects if npm pack is unsuccessful', async t => {
  const { stubs, testee, constants } = t.context;
  const error = new Error('error');
  td.when(stubs.npm.pack(constants.packagePath)).thenReject(error);
  try {
    await testee.pack(constants.packagePath);
  } catch (e) {
    t.is(e, error);
  }
});

test('pack - resolves with packed filename', async t => {
  const { stubs, testee, constants } = t.context;
  t.is(await testee.pack(constants.packagePath), constants.packedResult);
});

