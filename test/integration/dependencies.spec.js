const test = require('ava');
const path = require('path');
const dependencies = require('../../src/dependencies');


test('getSymlinked - retrieves symlinked modules - I', t => {
  const oneModulePath = path.resolve(__dirname, './test-project/packages/one');
  t.deepEqual(dependencies.getSymlinked(oneModulePath), [
    path.resolve(oneModulePath, 'node_modules/two')
  ]);
});

test('getSymlinked - retrieves symlinked modules - II', t => {
  const twoModulePath = path.resolve(__dirname, './test-project/packages/two');
  t.deepEqual(dependencies.getSymlinked(twoModulePath), [
    path.resolve(twoModulePath, 'node_modules/three'),
    path.resolve(twoModulePath, 'node_modules/@nsp/four')
  ]);
});
