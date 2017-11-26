const test = require('ava');
const td = require('testdouble');
const Forestry = require('forestry');

const setup = () => {
  const stubs = {
    fs: td.replace('fs'),
    path: td.replace('path')
  };
  const testee = require('../../../src/dependencies/index');
  return { stubs, testee };
};

const teardown = () => {
  td.reset();
};

const stubWithFakeFileDirectory = (dir, context) => {
  const { stubs } = context;
  const tree = Forestry.parse(dir, 'subDirs');
  stubs.path.resolve = function () { 
    return [...arguments].join('/'); 
  };
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
    td.when(stubs.fs.statSync(path)).thenReturn({ isDirectory: () => n.data.isDirectory});
    td.when(stubs.fs.lstatSync(path)).thenReturn({ isSymbolicLink: () => n.data.isSymlink});
  });
  const constants = {
    tree
  };
  return Object.assign({}, context, { constants });
}

test.beforeEach(t => {
  t.context = setup();
});

test.afterEach.always(teardown);

test('getSymlinked - returns empty array if no node_modules folder', t => {
  const { stubs, testee } = t.context;
  const modulePath = '/a'
  td.when(stubs.fs.existsSync('/a/node_modules')).thenReturn(false);
  t.deepEqual(testee.getSymlinked(modulePath), []);
});

test('getSymlinked - returns empty array if no symlinked modules', t => {
  const folderStruct = {
     name: 'a',
     subDirs: [{
       name: 'node_modules',
       subDirs: []
     }]
  };
  const { testee, constants } = stubWithFakeFileDirectory(folderStruct, t.context);
  t.deepEqual(testee.getSymlinked(constants.tree.data.name), []);
});

test('getSymlinked - returns top level symlinked modules', t => {
  const folderStruct = {
    name: 'a',
    subDirs: [{
      name: 'node_modules', 
      subDirs: [{
        name: 'one',
        isDirectory: true,
        isModule: true,
        isSymlink: true
      }, {
        name: 'two',
        isDirectory: true,
        isModule: false,
        isSymlink: true
      }, {
        name: 'three',
        isDirectory: true,
        isModule: true,
        isSymlink: false
      }, {
        name: 'four',
        isDirectory: true,
        isModule: true,
        isSymlink: true
      }]
    }]
  };
  const { testee, constants } = stubWithFakeFileDirectory(folderStruct, t.context);
  t.deepEqual(testee.getSymlinked(constants.tree.data.name), [
    'a/node_modules/one',
    'a/node_modules/four'
  ]);
});

test('getSymlinked - returns nested level symlinked modules', t => {
  const folderStruct = {
    name: 'a',
    subDirs: [{
      name: 'node_modules',
      subDirs: [{
        name: 'one',
        isDirectory: true,
        isModule: true,
        isSymlink: true
      }, {
        name: '@nested',
        isDirectory: true,
        subDirs: [{
          name: 'hello',
          isDirectory: true,
          isModule: true,
          isSymlink: true
        }, {
          name: 'what',
          isDirectory: true,
          subDirs: [{
            name: 'yeah',
            isDirectory: true,
            isModule: true,
            isSymlink: true
          }]
        }]
      }]
    }]
  };
  const { testee, constants } = stubWithFakeFileDirectory(folderStruct, t.context);
  t.deepEqual(testee.getSymlinked(constants.tree.data.name), [
    'a/node_modules/one',
    'a/node_modules/@nested/hello',
    'a/node_modules/@nested/what/yeah'
  ]);
});
