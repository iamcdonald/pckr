const test = require('ava');
const td = require('testdouble');
const FakeFileTree = require('./FakeFileTree');

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
  const fft = FakeFileTree.create(dir);
  stubs.path.resolve = function () { 
    return [...arguments].join('/'); 
  }; 
  stubs.fs.readdirSync = path => fft.getChildren(path);
  stubs.fs.existsSync = path => fft.find(path.replace('/package.json', '')).isModule;
  stubs.fs.lstatSync = path => ({ isSymbolicLink: () => fft.find(path).isSymlink });
  const constants = {
    fft
  };
  return Object.assign({}, context, { constants });
}

test.beforeEach(t => {
  t.context = setup();
});

test.afterEach.always(teardown);

test('getSymlinked - returns empty array if no symlinked modules', t => {
  const folderStruct = {
    'a': {
      children: {
        'node_modules': {
          children: {}
        }
      }
    }
  };
  const { testee, constants } = stubWithFakeFileDirectory(folderStruct, t.context);
  t.deepEqual(testee.getSymlinked(constants.fft.getBase()), []);
});

test('getSymlinked - returns top level symlinked modules', t => {
  const folderStruct = {
    'a': {
      children: {
        'node_modules': {
          children: {
            'one': {
              isModule: true,
              isSymlink: true
            },
            'two': {
              isModule: false,
              isSymlink: true
            },
            'three': {
              isModule: true,
              isSymlink: false
            },
            'four': {
              isModule: true,
              isSymlink: true
            }
          }
        }
      }
    }
  };
  const { testee, constants } = stubWithFakeFileDirectory(folderStruct, t.context);
  t.deepEqual(testee.getSymlinked(constants.fft.getBase()), [
    'a/node_modules/one',
    'a/node_modules/four'
  ]);
});

test('getSymlinked - returns nested level symlinked modules', t => {
  const folderStruct = {
    'a': {
      children: {
        'node_modules': {
          children: {
            'one': {
              isModule: true,
              isSymlink: true
            },
            '@nested': {
              children: {
                'hello': {
                  isModule: true,
                  isSymlink: true
                },
                'what': {
                  children: {
                    'yeah': {
                      isModule: true,
                      isSymlink: true
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };
  const { testee, constants } = stubWithFakeFileDirectory(folderStruct, t.context);
  t.deepEqual(testee.getSymlinked(constants.fft.getBase()), [
    'a/node_modules/one',
    'a/node_modules/@nested/hello',
    'a/node_modules/@nested/what/yeah'
  ]);
});
