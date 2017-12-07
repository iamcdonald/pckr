const test = require('ava');
const td = require('testdouble');


const setup = () => {
  td.config({
    ignoreWarnings: true
  });

  const stubs = {
    npm: td.replace('npm', {
      load: td.function(),
      pack: td.function()
    }),
    process: td.replace('process', {
      cwd: td.function()
    }),
    child_process: td.replace('child_process'),
    path: td.replace('path', {
      resolve: (b, r) => `${b}/${r}`
    })
  };
  const testee = require('../../../src/npm/index');
  return { stubs, testee };
};

const teardown = () => {
  td.config({
    ignoreWarnings: false
  });
  td.reset();
};

const setupPackStubs = context => {
  const { stubs } = context;
  const c = {
    base: '/base',
    packagePath: '../a/path/l',
    packedResult: 'a-thing-0.1.3.tgz',
    defaultPackedResult: 'default-0.0.0.tgz'
  };
  td.when(stubs.process.cwd()).thenReturn(c.base);
  td.when(stubs.npm.load()).thenCallback(null);
  td.when(stubs.npm.pack('.')).thenCallback(null, [c.packedResult]);
  td.when(stubs.npm.pack(c.packagePath)).thenCallback(null, [c.packedResult]);
  return Object.assign({}, context, { c });
};

const setupInstallStubs = context => {
  const { stubs } = context;
  const c = {
    module: '/a/path',
    file: '/a/path/l-0.0.0.tgz'
  };
  return Object.assign({}, context, { c });
};

test.beforeEach(t => {
  t.context = setup();
});

test.afterEach.always(teardown);


test('npm - pack - bails if load fails', async t => {
  const { stubs, testee } = setupPackStubs(t.context);
  const error = new Error('Load Died');
  td.when(stubs.npm.load()).thenCallback(error);
  try {
    await testee.pack();
  } catch (e) {
    t.is(e, error);
  }
});

test('npm - pack - bails if pack fails', async t => {
  const { stubs, testee } = setupPackStubs(t.context);
  const error = new Error('Pack Died');
  td.when(stubs.npm.pack('.')).thenCallback(error);
  try {
    await testee.pack();
  } catch (e) {
    t.is(e, error);
  }
});

test('npm - pack - packs chosen package if path provided', async t => {
  const { testee, c } = setupPackStubs(t.context);
  t.is(await testee.pack(c.packagePath), `${c.base}/${c.packedResult}`);
});

test('npm - installFileToModule - npm installs file for given module', async t => {
  t.plan(0);
  const { testee, stubs, c } = setupInstallStubs(t.context);
  await testee.installFileToModule(c.file, c.module);
  td.verify(stubs.child_process.execSync(`npm install ${c.file}`, {
    cwd: c.module,
    stdio: 'inherit'
  }));
});
