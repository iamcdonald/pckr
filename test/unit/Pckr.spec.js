const test = require('ava');
const td = require('testdouble');

const setup = () => {
  td.config({
    ignoreWarnings: true
  });

  const stubs = {
    pckrPckr: td.replace('../../src/pckrPckr'),
    Module: td.replace('../../src/Module')
  };

  td.when(stubs.pckrPckr.pack()).thenResolve();

  const Pckr = require('../../src/Pckr');

  return { stubs, Pckr };
};

const teardown = () => {
  td.config({
    ignoreWarnings: false
  });
  td.reset()
};

test.beforeEach(t => {
  t.context = setup();
});

test.afterEach.always(teardown);

test('Pckr - constructor', t => {
  const { Pckr, stubs } = t.context;
  const location = 'a/a/f';
  const p = new Pckr(location);
  td.verify(new stubs.Module(location))
  t.truthy(p.module instanceof stubs.Module);
});

test('Pckr - pack - packs pckr', async t => {
  t.plan(0);
  const { Pckr, stubs } = t.context;
  const location = 'a/a/f';
  const p = new Pckr(location);
  await p.pack();
  td.verify(stubs.pckrPckr.pack());
});

test('Pckr - pack - packs module', async t => {
  t.plan(0);
  const { Pckr, stubs } = t.context;
  const location = 'a/a/f';
  const p = new Pckr(location);
  await p.pack();
  td.verify(stubs.Module.prototype.pack());
});

test('Pckr - pack - remove pckr', async t => {
  t.plan(0);
  const { Pckr, stubs } = t.context;
  const location = 'a/a/f';
  const p = new Pckr(location);
  await p.pack();
  td.verify(stubs.pckrPckr.remove());
});

test('Pckr - pack - installs module', t => {
  t.plan(0);
  const { Pckr, stubs } = t.context;
  const location = 'a/a/f';
  const p = new Pckr(location);
  p.install();
  td.verify(stubs.Module.prototype.install());
});
