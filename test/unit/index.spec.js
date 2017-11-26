const test = require('ava');
const td = require('testdouble');
const path = require('path')
const Forestry = require('forestry');

const setup = () => {
  const stubs = {
    npm: td.replace('../../src/npm'),
    fs: td.replace('fs'),
    rimraf: td.replace('rimraf'),
    dependencies: td.replace('../../src/dependencies')
  };
  const testee = require('../../src/index');
  return { stubs, testee };
};

const teardown = () => {
  td.reset();
};

const stubWithFakeModuleStruct = (struct, context) => {
  const { stubs } = context;
  const tree = Forestry.parse(struct, 'subModules');
  
  const getPath = n => {
    let p = '';
    n.climb(d => p = p ? `${d.data.name}/${p}` : d.data.name);
    return p;
  };

  const find = path => tree.find(n => {
      return getPath(n) === path;
    });
  
  tree.traverse(n => {
    td.when(stubs.dependencies.getSymlinked(getPath(n))).thenReturn(n.children.map(getPath));
    td.when(stubs.npm.pack(getPath(n))).thenResolve(`${n.data.name}-0.0.0.tgz`);
  });
  td.when(stubs.rimraf(td.matchers.isA(String))).thenCallback();
  const constants = {
    tree
  };
  return Object.assign({}, context, { constants });
};

test.beforeEach(t => {
  t.context = setup();
});

test.afterEach.always(() => {
  teardown();
});

test('pack - rejects if npm pack is unsuccessful', async t => {
  const struct = {
    name: '/a',
    subModules: []
  };
  const { stubs, testee, constants } = stubWithFakeModuleStruct(struct, t.context); 
  const error = new Error('error');
  td.when(stubs.npm.pack(constants.tree.data.name)).thenReject(error);
  try {
    await testee.pack(constants.tree.data.name);
  } catch (e) {
    t.is(e, error);
  }
});

test('pack - rejects if cleanup unsusccessful', async t => {
  const struct = {
    name: '/a',
    subModules: []
  };
  const { stubs, testee, constants } = stubWithFakeModuleStruct(struct, t.context); 
  const error = new Error('error');
  td.when(stubs.rimraf(td.matchers.isA(String))).thenCallback(error);
  try {
    await testee.pack(constants.tree.data.name);
  } catch (e) {
    t.is(e, error);
  }

});

test('pack - creates sym-deps folder', async t => {
  t.plan(0);
  const struct = {
    name: '/a',
    subModules: [{
      name: 'b'
    }]
  };
  const { stubs, testee, constants } = stubWithFakeModuleStruct(struct, t.context); 
  const module = constants.tree.data.name;
  await testee.pack(module, '/stuff');
  td.verify(stubs.fs.mkdirSync('/a/sym-deps'));
});

test('pack - packs any symlinked deps to correct folder', async t => {
  t.plan(0);
  const struct = {
    name: '/a',
    subModules: [{
      name: 'b'
    }]
  };
  const { stubs, testee, constants } = stubWithFakeModuleStruct(struct, t.context); 
  const module = constants.tree.data.name;
  await testee.pack(module, '/stuff');
  td.verify(stubs.fs.renameSync('b-0.0.0.tgz', '/a/sym-deps/b-0.0.0.tgz'));
});

test('pack - packs any nested symlinked deps to correct folder', async t => {
  t.plan(0);
  const struct = {
    name: '/a',
    subModules: [{
      name: 'b',
      subModules: [{
        name: 'c'
      }]
    }]
  };
  const { stubs, testee, constants } = stubWithFakeModuleStruct(struct, t.context); 
  const module = constants.tree.data.name;
  await testee.pack(module, '/stuff');
  td.verify(stubs.fs.renameSync('c-0.0.0.tgz', '/a/b/sym-deps/c-0.0.0.tgz'));
});

test('pack - moves packed asset to location provided', async t => {
  t.plan(0);
  const struct = {
    name: 'a',
    subModules: []
  };
  const { stubs, testee, constants } = stubWithFakeModuleStruct(struct, t.context); 
  const toLocation = '/a/place/for/the/package';
  const module = constants.tree.data.name;
  await testee.pack(module, toLocation);
  td.verify(stubs.fs.renameSync('a-0.0.0.tgz', '/a/place/for/the/package/a-0.0.0.tgz'));
});

test('pack - resolves with packed filename', async t => {
  const struct = {
    name: 'a',
    subModules: []
  };
  const { stubs, testee, constants } = stubWithFakeModuleStruct(struct, t.context); 
  const toLocation = '/a/place/for/the/package';
  const expectedLocation = '/a/place/for/the/package/a-0.0.0.tgz'
  t.is(await testee.pack(constants.tree.data.name, toLocation), expectedLocation);
});

