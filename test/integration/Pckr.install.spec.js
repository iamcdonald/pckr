const test = require ('ava');
const path = require('path');
const fse = require('fs-extra');
const { execSync } = require('child_process');
const Pckr = require('../../src/Pckr');

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

const hasPackagedSubModule = (modulePath, subModule) =>
  fse.existsSync(getSymlinkDepPath(modulePath, subModule));

const setup = async () => {
  fse.mkdirSync(path.resolve(__dirname, TMP_DIR));
  const p = new Pckr(MODULE_TO_PACK);
  const packedPath = await p.pack(TO_LOCATION);
  const extractOne = untar(packedPath);
  return extractOne;
};

const teardown = () => {
  fse.removeSync(path.resolve(__dirname, TMP_DIR));
};

const isInstalled = (module, extractPath) =>
  fse.existsSync(path.resolve(extractPath, 'node_modules', module));

test.beforeEach(async t => {
  t.context = {
    extractPath: await setup()
  };
});

test.afterEach.always(teardown);

test('Pckr - install - installs all deps in sym-deps', t => {
  const { extractPath } = t.context;
  execSync('npm install', {
    cwd: extractPath
  });
  const index = require(path.resolve(extractPath, 'index'));
  const expected = [
    'one',
    ['two',
      ['three'],
      ['four', ['five']],
      ['five'],
      '001'
    ]
  ];
  t.deepEqual(expected, index());
});
