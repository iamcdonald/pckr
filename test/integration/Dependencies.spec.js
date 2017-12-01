const test = require('ava');
const path = require('path');
const Dependencies = require('../../src/Module/Dependencies');

test('Dependencies - getSymlinked - retrieves symlinked modules - I', t => {
  const oneModulePath = path.resolve(__dirname, 'test-project', 'packages', 'one');
  const d = new Dependencies(oneModulePath);
  t.deepEqual(d.getSymlinked(), [
    path.resolve(oneModulePath, 'node_modules', 'two-x-x')
  ]);
});

test('Dependencies - getSymlinked - retrieves symlinked modules - II', t => {
  const twoModulePath = path.resolve(__dirname, 'test-project', 'packages', 'two');
  const d = new Dependencies(twoModulePath);
  t.deepEqual(d.getSymlinked().sort(), [
    path.resolve(twoModulePath, 'node_modules', '@nsp', 'four-x-x'),
    path.resolve(twoModulePath, 'node_modules', 'five-x-x'),
    path.resolve(twoModulePath, 'node_modules', 'three-x-x')
  ]);
});
