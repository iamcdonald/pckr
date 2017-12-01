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

  const Pckr = require('../../../src/Module');

  return { stubs, Pckr };
};

const getPathFromNode = n => {
  let p = '';
  n.climb(d => p = p ? `${d.data.name}/${p}` : d.data.name);
  return p;
};

const setupDependenciesStub = n => ({
  getSymlinked: () => n.children.map(c => getPathFromNode(c))
});

const setupSymlinkDirectoryStub = n => {
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
  td.when(stub.getSymlinkFilePaths()).thenReturn(n.children.map(c => `${n.data.path}/sym-deps/${c.data.packedFileName}`))
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
    symlinkDirectory: setupSymlinkDirectoryStub(n),
    packageJson: setupPackageJsonStub(n)
  };

  td.when(new stubs.Dependencies(path)).thenReturn(n.data.stubs.dependencies);
  td.when(new stubs.SymlinkDirectory(path)).thenReturn(n.data.stubs.symlinkDirectory);
  td.when(new stubs.PackageJson(path)).thenReturn(n.data.stubs.packageJson);
  n.children.forEach(c => {
    td.when(stubs.npm.installFileToModule(c.data.packedLocation, n.data.path)).thenResolve();
  });
  td.when(stubs.npm.pack(path)).thenResolve(n.data.packedLocation);
  td.when(stubs.path.basename(n.data.packedLocation)).thenReturn(n.data.packedFileName);
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
        subModules: [{
          name: 'c',
          version: '1.0.0'
        }]
      }, {
        name: 'd',
        version: '2.1.3'
      }]
    }
  };

  td.when(stubs.pckrPckr.pack()).thenResolve();
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

test('Module - constructor', t => {
  const { Pckr, stubs, c } = t.context;
  const p = new Pckr(c.tree.data.name);
  t.is(p.location, c.tree.data.name);
  t.is(p.dependencies, c.tree.data.stubs.dependencies);
  t.is(p.symlinkDirectory, c.tree.data.stubs.symlinkDirectory);
  t.is(p.packageJson, c.tree.data.stubs.packageJson);
});

test('Module - pack - recursively - creates symlink directory', async t => {
  t.plan(4);
  const { Pckr, stubs, c } = t.context;
  const p = new Pckr(c.tree.data.name);
  await p.pack();
  c.tree.traverse(n => {
    t.pass();
    td.verify(n.data.stubs.symlinkDirectory.create());
  });
});

test('Module - pack -recursively - copys pckr package to symlink directory', async t => {
  t.plan(4);
  const { Pckr, stubs, c } = t.context;
  const p = new Pckr(c.tree.data.name);
  await p.pack();
  c.tree.traverse(n => {
    t.pass();
    td.verify(n.data.stubs.symlinkDirectory.copyFile(c.pckrPath));
  });
});

test('Module - pack - recursively - packs symlink dependencies', async t => {
  t.plan(4);
  const { Pckr, stubs, c } = t.context;
  const p = new Pckr(c.tree.data.name);
  await p.pack();
  c.tree.traverse(n => {
    t.pass();
    td.verify(stubs.npm.pack(n.data.path));
  });
});

test('Module - pack - recursively - moves packaged symlink dependencies into symlink directory', async t => {
  t.plan(4);
  const { Pckr, stubs, c } = t.context;
  const p = new Pckr(c.tree.data.name);
  await p.pack();
  const root = c.tree;
  root.traverse(n => {
    t.pass();
    n.children.forEach(c => {
      td.verify(n.data.stubs.symlinkDirectory.addFile(c.data.packedLocation));
    });
  });
});

test('Module - pack - recursively - updates scripts with preinstall task', async t => {
  t.plan(4);
  const { Pckr, stubs, c } = t.context;
  const p = new Pckr(c.tree.data.name);
  await p.pack();
  c.tree.traverse(n => {
    t.pass();
    td.verify(n.data.stubs.packageJson.updateScripts({
      preinstall: `npm install ${n.data.stubs.symlinkDirectory.getPckrPath()} && pckr install`
    }));
  });
});

test('Module - pack - recursively - remove dependencies from each package.json', async t => {
  t.plan(4);
  const { Pckr, stubs, c } = t.context;
  const p = new Pckr(c.tree.data.name);
  await p.pack();
  c.tree.traverse(n => {
    t.pass();
    n.children.forEach(c => {
      td.verify(n.data.stubs.packageJson.removeDependency(c.data.name));
    });
  });
});

test('Module - pack - recursively - packages module', async t => {
  t.plan(4);
  const { Pckr, stubs, c } = t.context;
  const p = new Pckr(c.tree.data.name);
  await p.pack();
  c.tree.traverse(n => {
    t.pass();
    td.verify(stubs.npm.pack(n.data.path));
  });
});

test('Module - pack - recursively - moves packaged module into module directory', async t => {
  t.plan(4);
  const { Pckr, stubs, c } = t.context;
  const p = new Pckr(c.tree.data.name);
  await p.pack();
  c.tree.traverse(n => {
    t.pass();
    td.verify(stubs.fse.renameSync(n.data.packedLocation, `${n.data.path}/${n.data.packedFileName}`));
  });
});

test('Module - pack - recursively - replace package json', async t => {
  t.plan(4);
  const { Pckr, stubs, c } = t.context;
  const p = new Pckr(c.tree.data.name);
  await p.pack();
  c.tree.traverse(n => {
    t.pass();
    td.verify(n.data.stubs.packageJson.replace());
  });
});

test('Module - pack - recursively - restores package json', async t => {
  t.plan(4);
  const { Pckr, stubs, c } = t.context;
  const p = new Pckr(c.tree.data.name);
  await p.pack();
  c.tree.traverse(n => {
    t.pass();
    td.verify(n.data.stubs.packageJson.restore());
  });
});

test('Module - pack - recursively - removes symlink directory', async t => {
  t.plan(4);
  const { Pckr, stubs, c } = setupStubs(t.context);
  const p = new Pckr(c.tree.data.name);
  await p.pack();
  c.tree.traverse(n => {
    t.pass();
    td.verify(n.data.stubs.symlinkDirectory.remove());
  });
});

test('Module - getPackagePath - when module not yet packed throws error', t => {
  const { Pckr, stubs, c } = setupStubs(t.context);
  const p = new Pckr(c.tree.data.name);
  t.throws(() => p.getPackagePath(), 'Module not yet packed');
});

test('Module - getPackagePath - when module packed returns path to packed file', async t => {
  const { Pckr, stubs, c } = setupStubs(t.context);
  const p = new Pckr(c.tree.data.name);
  await p.pack();
  t.is(p.getPackagePath(), c.tree.data.packedLocation);
});

test('Module - install - installs all symlink dependencies', t => {
  t.plan(0);
  const { Pckr, stubs, c } = setupStubs(t.context);
  const p = new Pckr(c.tree.data.name);
  p.install();
  const root = c.tree;
  root.children.forEach(c => {
    td.verify(stubs.npm.installFileToModule(`${root.data.path}/sym-deps/${c.data.packedFileName}`, root.data.path));
  });
});
