const test = require('ava');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const rimraf = require('rimraf');
const pckr = require('../../src');


const MODULE_TO_PACK = path.resolve(__dirname, 'test-project/packages/one');
const TO_LOCATION = __dirname;
const TMP_DIR = 'tmp';

const untar = tarLocation => {
  const name = path.basename(tarLocation).replace(/.tgz/, '');
  const extracted = path.resolve(__dirname, TMP_DIR, name);
  fs.mkdirSync(extracted);
  execSync(`tar -xf ${tarLocation} -C ${extracted}`);
  return path.resolve(extracted, 'package');
}
const getSymlinkDepPath = (modulePath, subModule) => 
  path.resolve(modulePath, 'sym-deps', subModule);

const hasPackagedSubModule = (modulePath, subModule) =>
  fs.existsSync(getSymlinkDepPath(modulePath, subModule));

const setup = () => {
  fs.mkdirSync(path.resolve(__dirname, TMP_DIR));
};

const teardown = t => {
  rimraf(path.resolve(__dirname, TMP_DIR), t.end);
};

test.beforeEach(setup);
test.cb.afterEach.always(teardown);

test('pack - packs given module and returns path to .tgz', async t => {
  const packedPath = await pckr.pack(MODULE_TO_PACK, TO_LOCATION);
  const packageExists = fs.existsSync(packedPath);
  t.truthy(packageExists);
});

test('pack - includes symlinked top level dependencies', async t => {
  const packedPath = await pckr.pack(MODULE_TO_PACK, TO_LOCATION);
  const extracted = untar(packedPath);
  t.truthy(hasPackagedSubModule(extracted, 'two-1.0.0.tgz'));
});

test('pack - includes nested symlink dependencies', async t => {
  const packedPath = await pckr.pack(MODULE_TO_PACK, TO_LOCATION);
  const extracted = untar(packedPath);
  const twoDepPath = getSymlinkDepPath(extracted, 'two-1.0.0.tgz');
  const twoExtracted = untar(twoDepPath);
  t.truthy(hasPackagedSubModule(twoExtracted, 'three-1.0.0.tgz'));
  t.truthy(hasPackagedSubModule(twoExtracted, 'nsp-four-1.0.0.tgz'));
});
