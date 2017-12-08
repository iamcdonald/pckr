const test = require('ava');
const path = require('path');
const fse = require('fs-extra');
const { execSync } = require('child_process');
const Pckr = require('../../src/Pckr');
const SymlinkDirectory = require('../../src/Module/SymlinkDirectory');


const MODULE_TO_PACK = path.resolve(__dirname, 'test-project/packages/one');
const TO_LOCATION = __dirname;
const TMP_DIR = 'tmp';

const untar = tarLocation => {
  const name = path.basename(tarLocation).replace(/.tgz/, '');
  const extracted = path.resolve(__dirname, TMP_DIR, name);
  fse.mkdirSync(extracted);
  execSync(`tar -xf ${tarLocation} -C ${extracted}`);
  return path.resolve(extracted, 'package');
}
const getSymlinkDepPath = (modulePath, subModule) =>
  path.resolve(modulePath, 'sym-deps', subModule);

const hasPackagedSubModule = (modulePath, subModule) => {
  if (!(subModule instanceof RegExp)) {
    subModule = RegExp(subModule);
  }
  const sd = new SymlinkDirectory(modulePath);
  return sd.getFilePaths()
     .find(f => subModule.test(f));
};

const setup = () => {
  fse.mkdirSync(path.resolve(__dirname, TMP_DIR));
};

const teardown = () => {
  fse.removeSync(path.resolve(__dirname, TMP_DIR));
};

test.beforeEach(setup);
test.afterEach.always(teardown);

test('Pckr - pack - packs given module and returns path to .tgz', async t => {
  const p = new Pckr(MODULE_TO_PACK);
  const packedPath = await p.pack(TO_LOCATION);
  t.truthy(fse.existsSync(packedPath));
});

test('Pckr - pack - includes symlinked top level dependencies', async t => {
  const p = new Pckr(MODULE_TO_PACK);
  const packedPath = await p.pack(TO_LOCATION);
  const extracted = untar(packedPath);
  t.truthy(hasPackagedSubModule(extracted, 'two-x-x-1.0.0.tgz'));
});

test('Pckr - pack - includes nested symlink dependencies', async t => {
  const p = new Pckr(MODULE_TO_PACK);
  const packedPath = await p.pack(TO_LOCATION);
  const extracted = untar(packedPath);
  const twoDepPath = getSymlinkDepPath(extracted, 'two-x-x-1.0.0.tgz');
  const twoExtracted = untar(twoDepPath);
  t.truthy(hasPackagedSubModule(twoExtracted, 'three-x-x-1.0.0.tgz'));
  t.truthy(hasPackagedSubModule(twoExtracted, 'nsp-four-x-x-1.0.0.tgz'));
});
