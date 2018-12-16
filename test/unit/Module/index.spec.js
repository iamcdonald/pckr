const test = require('ava');
const td = require('testdouble');
const Forestry = require('forestry');

const setup = () => {
  td.config({
    ignoreWarnings: true
  });

  const stubs = {
    path: td.replace('path'),
    fse: td.replace('fs-extra'),
    child_process: td.replace('child_process'),
    npm : td.replace('../../../src/npm', {
      pack: td.function(),
      installFileToModule: td.function()
    }),
    pckrPckr: td.replace('../../../src/pckrPckr'),
    Dependencies: td.replace('../../../src/Module/Dependencies'),
    SymlinkDirectory: td.replace('../../../src/Module/SymlinkDirectory'),
    PackageJson: td.replace('../../../src/Module/PackageJson')
  };

  stubs.path.resolve = function () {
    return [...arguments].join('/');
  };

  const Module = require('../../../src/Module');

  return { stubs, Module };
};

const getPathFromNode = n => {
  let p = '';
  n.climb(d => p = p ? `${d.data.name}/${p}` : d.data.name);
  return p;
};

const setupDependenciesStub = n => ({
  getSymlinked: () => n.children.map(c => getPathFromNode(c))
});

const setupSymlinkDirectoryStub = (n, stubs) => {
  const stub = td.object([
    'create',
    'remove',
    'getPath',
    'getPckrPath',
    'addFile',
    'copyFile',
    'getSymlinkFilePaths'
  ]);
  td.when(stub.getPath()).thenReturn(`${n.data.path}sym-deps`);
  td.when(stub.getPckrPath()).thenReturn(`sym-deps/pckr-0.1.1.tgz`);
  const symlinkFilePaths = n.children.map(c => `${n.data.path}/sym-deps/${c.data.packedFileName}`);
  td.when(stub.getSymlinkFilePaths()).thenReturn(symlinkFilePaths);
  return stub;
};

const setupPackageJsonStub = n => {
  const stub = td.object([
    'updateScripts',
    'removeDependency',
    'replace',
    'restore',
    'getName',
    'getVersion'
  ]);
  td.when(stub.getName()).thenReturn(n.data.name);
  td.when(stub.getVersion()).thenReturn(n.data.version);
  return stub;
}

const setupNodeStubs = stubs => n => {
  const path = getPathFromNode(n);
  n.data.path = path;
  n.data.packedFileName = `${n.data.name}-0.0.0.tgz`;
  n.data.packedLocation = `${n.data.path}/${n.data.packedFileName}`;

  n.data.stubs = {
    dependencies: setupDependenciesStub(n),
    symlinkDirectory: setupSymlinkDirectoryStub(n, stubs),
    packageJson: setupPackageJsonStub(n)
  };

  td.when(new stubs.Dependencies(path)).thenReturn(n.data.stubs.dependencies);
  td.when(new stubs.SymlinkDirectory(path)).thenReturn(n.data.stubs.symlinkDirectory);
  td.when(new stubs.PackageJson(path)).thenReturn(n.data.stubs.packageJson);
  n.children.forEach(c => {
    td.when(stubs.npm.installFileToModule(c.data.packedLocation, n.data.path)).thenReturn();
  });
  td.when(stubs.path.basename(n.data.packedLocation)).thenReturn(n.data.packedFileName);
  td.when(stubs.npm.pack(path)).thenReturn(n.data.packedFileName);
};

const setupStubs = context => {
  const { stubs } = context;
  const c = {
    pckrPath: '/pckr/path/pckr-1.0.0.tgz',
    tree: {
      name: 'a',
      version: '0.1.0',
      subModules: [{
        name: 'b',
        version: '1.0.1',
        subModules: [{
          name: 'c',
          version: '1.0.0'
        }]
      }, {
        name: 'd',
        version: '2.1.3',
        submodules: [{
          name: 'c',
          version: '1.0.0'
        }]
      }]
    }
  };

  td.when(stubs.pckrPckr.pack()).thenReturn();
  td.when(stubs.pckrPckr.getPath()).thenReturn(c.pckrPath);
  c.tree = Forestry.parse(c.tree, 'subModules');

  c.tree.traverse(setupNodeStubs(stubs), Forestry.TRAVERSAL_TYPES.DFS_POST);

  return Object.assign({}, context, { c });
};

const teardown = () => {
  td.config({
    ignoreWarnings: false
  });
  td.reset()
};

test.beforeEach(t => {
  t.context = setup();
  t.context = setupStubs(t.context);
});

test.afterEach.always(teardown);

test('Module - constructor - root', t => {
  const { Module, stubs, c } = t.context;
  const p = new Module(c.tree.data.name, true);
  t.is(p.location, c.tree.data.name);
  t.is(p.root, true);
  t.is(p.dependencies, c.tree.data.stubs.dependencies);
  t.is(p.symlinkDirectory, c.tree.data.stubs.symlinkDirectory);
  t.is(p.packageJson, c.tree.data.stubs.packageJson);
});

test('Module - constructor - non-root', t => {
  const { Module, stubs, c } = t.context;
  const p = new Module(c.tree.data.name);
  t.is(p.location, c.tree.data.name);
  t.is(p.root, false);
  t.is(p.dependencies, c.tree.data.stubs.dependencies);
  t.is(p.symlinkDirectory, c.tree.data.stubs.symlinkDirectory);
  t.is(p.packageJson, c.tree.data.stubs.packageJson);
});

test('Module - constructor - root production only', t => {
  const { Module, stubs, c } = t.context;
  const p = new Module(c.tree.data.name, true, true);
  t.is(p.location, c.tree.data.name);
  t.is(p.root, true);
  t.is(p.prodOnly, true);
  t.is(p.dependencies, c.tree.data.stubs.dependencies);
  t.is(p.symlinkDirectory, c.tree.data.stubs.symlinkDirectory);
  t.is(p.packageJson, c.tree.data.stubs.packageJson);
});

test('Module - pack - root - creates symlink directory', async t => {
  t.plan(0);
  const { Module, stubs, c } = t.context;
  const p = new Module(c.tree.data.name, true);
  await p.pack();
  td.verify(p.symlinkDirectory.create());
});

test('Module - pack - root - copys pckr package to symlink directory', async t => {
  t.plan(0);
  const { Module, stubs, c } = t.context;
  const p = new Module(c.tree.data.name, true);
  await p.pack();
  td.verify(c.tree.data.stubs.symlinkDirectory.copyFile(c.pckrPath));
});

test('Module - pack - root - packs downstream symlink dependencies', async t => {
  t.plan(3);
  const { Module, stubs, c } = t.context;
  const p = new Module(c.tree.data.name, true);
  await p.pack();
  c.tree.traverse(n => {
    if (n.parent) {
      td.verify(stubs.npm.pack(n.data.path));
      t.pass();
    }
  });
});

test('Module - pack - root - adds downstream symlink dependencies, excluding duplicates, with correct ordered names to symlink directory', async t => {
  t.plan(0);
  const { Module, stubs, c } = t.context;
  const p = new Module(c.tree.data.name, true);
  await p.pack();
  td.verify(p.symlinkDirectory.addFile('a/b/c/c-0.0.0.tgz', '0.c-0.0.0.tgz'));
  td.verify(p.symlinkDirectory.addFile('a/b/b-0.0.0.tgz', '1.b-0.0.0.tgz'));
  td.verify(p.symlinkDirectory.addFile('a/d/d-0.0.0.tgz', '2.d-0.0.0.tgz'));
  td.verify(p.symlinkDirectory.addFile(td.matchers.isA(String), td.matchers.isA(String)), { times: 3 });
});

test('Module - pack - root - adds downstream symlink dependencies, excluding duplicates, with correct ordered names to symlink directory - production only', async t => {
  t.plan(0);
  const { Module, stubs, c } = t.context;
  const p = new Module(c.tree.data.name, true, true);
  await p.pack();
  td.verify(p.symlinkDirectory.addFile('a/b/c/c-0.0.0.tgz', '0.c-0.0.0.tgz'));
  td.verify(p.symlinkDirectory.addFile('a/b/b-0.0.0.tgz', '1.b-0.0.0.tgz'));
  td.verify(p.symlinkDirectory.addFile('a/d/d-0.0.0.tgz', '2.d-0.0.0.tgz'));
  td.verify(p.symlinkDirectory.addFile(td.matchers.isA(String), td.matchers.isA(String)), { times: 3 });
});
//
test('Module - pack - root - remove each symlinked dependency from package json', async t => {
  t.plan(0);
  const { Module, stubs, c } = t.context;
  const p = new Module(c.tree.data.name, true);
  await p.pack();
  td.verify(p.packageJson.removeDependency('b'));
  td.verify(p.packageJson.removeDependency('c'));
  td.verify(p.packageJson.removeDependency('d'));
});

test('Module - pack - root - updates scripts with postinstall task that installs pckr and calls \'pckr install\'', async t => {
  t.plan(0);
  const { Module, stubs, c } = t.context;
  let root = c.tree;
  const p = new Module(root.data.name, true);
  await p.pack();
  td.verify(p.packageJson.updateScripts({
    postinstall: `npm install ${p.symlinkDirectory.getPckrPath()} && pckr install`
  }));
});

test('Module - pack - root - replace package json with modified version', async t => {
  t.plan(0);
  const { Module, stubs, c } = t.context;
  let root = c.tree;
  const p = new Module(root.data.name, true);
  await p.pack();
  td.verify(p.packageJson.replace());
});

test('Module - pack - root - npm packs module and assigns resulting name to filename', async t => {
  const { Module, stubs, c } = t.context;
  const p = new Module(c.tree.data.name, true);
  td.when(stubs.npm.pack(p.location)).thenReturn('a filename');
  await p.pack();
  t.is(p.filename, 'a filename');
});

test('Module - pack - root - cleans up changes made to directory and package json', async t => {
  t.plan(0);
  const { Module, stubs, c } = t.context;
  const p = new Module(c.tree.data.name, true);
  await p.pack();
  td.verify(p.packageJson.restore());
  td.verify(p.symlinkDirectory.remove());
});

test('Module - pack - non-root - only npm packs module and assigns resulting name to filename', async t => {
  const { Module, stubs, c } = t.context;
  const p = new Module(c.tree.data.name, false);
  td.when(stubs.npm.pack(p.location)).thenReturn('a filename');
  await p.pack();
  t.is(p.filename, 'a filename');

  td.verify(p.symlinkDirectory.create(), { times: 0, ignoreExtraArgs: true });
  td.verify(c.tree.data.stubs.symlinkDirectory.copyFile(), { times: 0, ignoreExtraArgs: true });
  td.verify(p.symlinkDirectory.addFile(), { times: 0, ignoreExtraArgs: true });
  td.verify(p.packageJson.removeDependency(), { times: 0, ignoreExtraArgs: true });
  td.verify(p.packageJson.updateScripts(), { times: 0, ignoreExtraArgs: true });
  td.verify(p.packageJson.restore(), { times: 0, ignoreExtraArgs: true });
  td.verify(p.symlinkDirectory.remove(), { times: 0, ignoreExtraArgs: true });
});

test('Module - getPackagePath - when module not yet packed throws error', t => {
  const { Module, stubs, c } = setupStubs(t.context);
  const p = new Module(c.tree.data.name);
  t.throws(() => p.getPackagePath(), 'Module not yet packed');
});

test('Module - getPackagePath - when module packed returns path to packed file', async t => {
  const { Module, stubs, c } = setupStubs(t.context);
  const p = new Module(c.tree.data.name);
  await p.pack();
  t.is(p.getPackagePath(), c.tree.data.packedLocation);
});

test('Module - install - installs all symlink dependencies in ascending order', t => {
  t.plan(3);
  const { Module, stubs, c } = setupStubs(t.context);
  const p = new Module(c.tree.data.name);
  const symlinkFilePaths = [
    '2.a-0.1.0.tgz',
    '0.b-0.1.0.tgz',
    '1.f-1.1.0.tgz'
  ];
  td.when(p.symlinkDirectory.getSymlinkFilePaths())
    .thenReturn(symlinkFilePaths.slice());
  const captor = td.matchers.captor();
  symlinkFilePaths.forEach(slp => {
    td.when(stubs.path.basename(slp))
      .thenReturn(slp);
  });
  p.install();
  symlinkFilePaths.forEach(slp => {
    td.verify(stubs.npm.installFileToModule(slp, p.location));
  });
  t.is(td.explain(stubs.npm.installFileToModule).calls[0].args[0], symlinkFilePaths[1]);
  t.is(td.explain(stubs.npm.installFileToModule).calls[1].args[0], symlinkFilePaths[2]);
  t.is(td.explain(stubs.npm.installFileToModule).calls[2].args[0], symlinkFilePaths[0]);
});
