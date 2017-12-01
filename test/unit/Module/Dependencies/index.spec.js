const test = require('ava');
const td = require('testdouble');
const Forestry = require('forestry');

const setup = () => {
  const stubs = {
    fs: td.replace('fs'),
    path: td.replace('path')
  };
  stubs.path.resolve = function () {
    return [...arguments].join('/');
  };
  const Dependencies = require('../../../../src/Module/Dependencies/index');
  return { stubs, Dependencies };
};

const teardown = () => {
  td.reset();
};

const stubWithFakeFileDirectory = (dir, context) => {
  const { stubs } = context;
  const tree = Forestry.parse(dir, 'subDirs');
  const getPath = n => {
    let p = '';
    n.climb(d => p = p ? `${d.data.name}/${p}` : d.data.name);
    return p;
  }
  const find = path => tree.find(n => getPath(n) === path);
  td.when(stubs.fs.existsSync(`${tree.data.name}/node_modules`)).thenReturn(true);
  tree.traverse(n => {
    const path = getPath(n);
    td.when(stubs.fs.readdirSync(path)).thenReturn(n.children.map(c => c.data.name));
    td.when(stubs.fs.existsSync(`${path}/package.json`)).thenReturn(n.data.isModule);
    td.when(stubs.fs.statSync(path)).thenReturn({
      isDirectory: () => n.data.isDirectory || n.data.isModule
    });
    td.when(stubs.fs.lstatSync(path)).thenReturn({
      isSymbolicLink: () => n.data.isSymlink
    });
  });
  const c = {
    tree
  };
  return Object.assign({}, context, { c });
}

test.beforeEach(t => {
  t.context = setup();
});

test.afterEach.always(teardown);

test('Dependencies - constructor', t => {
  const { Dependencies } = t.context;
  const location = 'a/mod/ule'
  const d = new Dependencies(location);
  t.is(d.location, location);
});

test('Dependencies - hasNodeModulesDirectory - returns true if module has a node_modules folder', t => {
  const { Dependencies, stubs } = t.context;
  const location = '/a/m/d';
  const d = new Dependencies(location);
  td.when(stubs.fs.existsSync(`${location}/node_modules`)).thenReturn(true);
  t.truthy(d.hasNodeModulesDirectory())
});

test('Dependencies - hasNodeModulesDirectory - returns false if module has no node_modules folder', t => {
  const { Dependencies, stubs } = t.context;
  const location = '/a/m/d';
  const d = new Dependencies(location);
  td.when(stubs.fs.existsSync(`${location}/node_modules`)).thenReturn(false);
  t.falsy(d.hasNodeModulesDirectory())
});

test('Dependencies - getNodeModulesPath - returns path for node_modules', t => {
  const { Dependencies, stubs } = t.context;
  const location = '/a/m/d';
  const d = new Dependencies(location);
  t.is(d.getNodeModulesPath(), `${location}/node_modules`);
});

test('Dependencies - get - retrieves all installed dependencies locations', t => {
  const folderStruct = {
    name: 'a',
    subDirs: [{
      name: 'node_modules',
      subDirs: [{
        name: 'a',
        isModule: true
      }, {
        name: 'b',
        isModule: true
      }, {
        name: 'c',
        isModule: false
      }]
    }]
  };
  const { Dependencies, c } = stubWithFakeFileDirectory(folderStruct, t.context);
  const d = new Dependencies(c.tree.data.name);
  t.deepEqual(d.get(), [
    'a/node_modules/a',
    'a/node_modules/b'
  ]);
});

test('Dependencies - get - includes nested modules', t => {
  const folderStruct = {
    name: 'a',
    subDirs: [{
      name: 'node_modules',
      subDirs: [{
        name: 'a',
        isModule: true
      }, {
        name: 'b',
        isModule: true
      }, {
        name: 'c',
        isDirectory: true,
        subDirs: [{
          name: 'e',
          isModule: true
        }]
      }]
    }]
  };
  const { Dependencies, c } = stubWithFakeFileDirectory(folderStruct, t.context);
  const d = new Dependencies(c.tree.data.name);
  t.deepEqual(d.get(), [
    'a/node_modules/a',
    'a/node_modules/b',
    'a/node_modules/c/e'
  ]);
});

test('Dependencies - get - returns empty array if no node_modules folder', t => {
  const { Dependencies, stubs } = t.context;
  const modulePath = '/a/b/c'
  const d = new Dependencies(modulePath);
  td.when(stubs.fs.existsSync(`${modulePath}/node_modules`)).thenReturn(false);
  t.deepEqual(d.get(), []);
});


test('Dependencies - getSymlinked - returns symlinked modules', t => {
  const folderStruct = {
    name: 'a',
    subDirs: [{
      name: 'node_modules',
      subDirs: [{
        name: 'a',
        isModule: true
      }, {
        name: 'b',
        isModule: true,
        isSymlink: true
      }, {
        name: 'c',
        isDirectory: true,
        subDirs: [{
          name: 'e',
          isModule: true,
          isSymlink: true
        }]
      }]
    }]
  };
  const { Dependencies, c } = stubWithFakeFileDirectory(folderStruct, t.context);
  const d = new Dependencies(c.tree.data.name);
  t.deepEqual(d.getSymlinked(), [
    'a/node_modules/b',
    'a/node_modules/c/e'
  ]);
});
