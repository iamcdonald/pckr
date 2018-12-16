const test = require('ava');

const setup = () => ({
  testee: require('../../src/options')
})

test.beforeEach(t => {
  t.context = setup();
});

test.afterEach(() => {
  Object.keys(require.cache).forEach(function(key) { delete require.cache[key] });
})

test('options - set - overlays options', t => {
  const { testee } = t.context;
  testee.set({ stuff: true })
  t.deepEqual(testee.get(), { production: false, stuff: true })
})

test('options - set - overwrites default options', t => {
  const { testee } = t.context;
  testee.set({ production: true })
  t.deepEqual(testee.get(), { production: true })
})

test('options - get - when set not called - retrieves default options', t => {
  const { testee } = t.context;
  t.deepEqual(testee.get(), { production: false })
})
