const test = require('ava');
const td = require('testdouble');
const { Buffer } = require('buffer');

const setup = () => {
  td.config({
    ignoreWarnings: true
  });

  const stubs = {
    child_process: td.replace('child_process')
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

test.beforeEach(t => {
  t.context = setup();
});

test.afterEach.always(teardown);

test('npm - pack - packs and returns package name from npm pack', t => {
  const { testee, stubs } = t.context;
  const modulePath = '/c/module/yeah';
  const packageName = 'yeah-0.0.0.tgz';
  td.when(stubs.child_process.execSync('npm pack', {
    cwd: modulePath
  })).thenReturn(new Buffer(packageName))
  t.is(testee.pack(modulePath), packageName);
});

test('npm - installFileToModule - npm installs file for given module', t => {
  t.plan(0);
  const { testee, stubs } = t.context;
  const file = './files/t-0.1.0.tgz';
  const module = '/a/module';
  testee.installFileToModule(file, module);
  td.verify(stubs.child_process.execSync(`npm install ${file}`, {
    cwd: module
  }));
});
