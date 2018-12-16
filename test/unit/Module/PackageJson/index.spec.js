const test = require('ava');
const td = require('testdouble');

const setup = () => {
  const stubs = {
    fse: td.replace('fs-extra'),
    path: td.replace('path')
  };

  stubs.path.resolve = function () {
    return [...arguments].join('/');
  };

  const PackageJson = require('../../../../src/Module/PackageJson');

  return { stubs, PackageJson };
};

const setupStubs = (context, packageJsonOverride) => {
  const { stubs } = context;
  const c = {
    location: '/a/f/k',
    packageJson: {
      name: 'a',
      scripts: {}
    },
    pckrPath: '/pckr/pat/a.tgz'
  };
  c.packageJson = packageJsonOverride || c.packageJson;
  td.when(stubs.fse.readFileSync(`${c.location}/package.json`))
    .thenReturn(JSON.stringify(c.packageJson, null, '\t'));
  return Object.assign(context, { c });
};

const teardown = () => {
  td.reset()
};

test.beforeEach(t => {
  t.context = setup();
  t.context = setupStubs(t.context);
});

test.afterEach.always(teardown);

test('PackageJson - create - creates and initializes package.json path', t => {
  const { stubs, PackageJson, c } = t.context;
  const pj = new PackageJson(c.location);
  t.is(pj._packageJsonPath, `${c.location}/package.json`);
});

test('PackageJson - create - creates and initializes package.tmp.json path', t => {
  const { stubs, PackageJson, c } = t.context;
  const pj = new PackageJson(c.location);
  t.is(pj._tempPackageJsonPath, `${c.location}/package.tmp.json`);
});

test('PackageJson - create - creates and initializes module package.json', t => {
  const { stubs, PackageJson, c } = t.context;
  const pj = new PackageJson(c.location);
  t.deepEqual(pj._packageJson, c.packageJson);
});

test('PackageJson - updateScripts - adds a single script to in memory package.json', t => {
  const { stubs, PackageJson, c } = t.context;
  const pj = new PackageJson(c.location);
  const script = {
    'a-script': 'yeah'
  };
  pj.updateScripts(script);
  t.is(pj._packageJson.scripts['a-script'], 'yeah');
});

test('PackageJson - updateScripts - prepends if script already exists', t => {
  const packageJson = {
    scripts: {
      thing: 'a thing'
    }
  };
  const { stubs, PackageJson, c } = setupStubs(t.context, packageJson);
  const pj = new PackageJson(c.location);
  const script = {
    thing: 'yeah'
  };
  pj.updateScripts(script);
  t.is(pj._packageJson.scripts.thing, 'yeah && a thing');
});

test('PackageJson - updateScripts - leaves other scripts unchanged', t => {
  const packageJson = {
    scripts: {
      thing1: 'a thing'
    }
  };
  const { stubs, PackageJson, c } = setupStubs(t.context, packageJson);
  const pj = new PackageJson(c.location);
  const script = {
    thing: 'yeah'
  };
  pj.updateScripts(script);
  t.is(pj._packageJson.scripts.thing1, 'a thing');
});

test('PackageJson - updateScripts - updates multiple scripts if given', t => {
  const packageJson = {
    scripts: {
      thing1: 'a thing'
    }
  };
  const { stubs, PackageJson, c } = setupStubs(t.context, packageJson);
  const pj = new PackageJson(c.location);
  const script = {
    thing: 'yeah',
    one: 'two'
  };
  pj.updateScripts(script);
  t.is(pj._packageJson.scripts.thing, 'yeah');
  t.is(pj._packageJson.scripts.one, 'two');
});

test('PackageJson - removeDependency - removes dependency from script dependencies', t => {
  const packageJson = {
    scripts: {
      thing1: 'a thing'
    },
    dependencies: {
      boss: '*'
    }
  };
  const { stubs, PackageJson, c } = setupStubs(t.context, packageJson);
  const pj = new PackageJson(c.location);
  pj.removeDependency('boss');
  t.falsy(pj._packageJson.dependencies.boss);
});

test('PackageJson - removeDependency - removes dependency from script devDependencies', t => {
  const packageJson = {
    scripts: {
      thing1: 'a thing'
    },
    devDependencies: {
      boss: '*'
    }
  };
  const { stubs, PackageJson, c } = setupStubs(t.context, packageJson);
  const pj = new PackageJson(c.location);
  pj.removeDependency('boss');
  t.falsy(pj._packageJson.devDependencies.boss);
});

test('PackageJson - replace - backs up existing package.json', t => {
  t.plan(0);
  const { stubs, PackageJson, c } = t.context;
  const pj = new PackageJson(c.location);
  pj.replace();
  td.verify(stubs.fse.renameSync(
    pj._packageJsonPath,
    pj._tempPackageJsonPath
  ));
});

test('PackageJson - replace - write in memory package.json to package.json location', t => {
  t.plan(0);
  const { stubs, PackageJson, c } = t.context;
  const pj = new PackageJson(c.location);
  pj.replace();
  td.verify(stubs.fse.writeFileSync(
    pj._packageJsonPath,
    JSON.stringify(pj._packageJson, null, '\t')
  ));
});

test('PackageJson - restore - move package.tmp.json back to package.json', t => {
  t.plan(0);
  const { stubs, PackageJson, c } = t.context;
  const pj = new PackageJson(c.location);
  pj.restore();
  td.verify(stubs.fse.renameSync(
    pj._tempPackageJsonPath,
    pj._packageJsonPath
  ));
});

test('PackageJson - getName - returns name from modules package.json', t => {
  const packageJson = {
    name: 'a-name'
  };
  const { stubs, PackageJson, c } = setupStubs(t.context, packageJson);
  const pj = new PackageJson(c.location);
  t.is(pj.getName(), 'a-name');
});

test('PackageJson - getVersion - returns version from modules package.json', t => {
  const packageJson = {
    version: '2.2.2'
  };
  const { stubs, PackageJson, c } = setupStubs(t.context, packageJson);
  const pj = new PackageJson(c.location);
  t.is(pj.getVersion(), '2.2.2');
});

test('PackageJson - getDependencies - returns dependencies from modules package.json', t => {
  const packageJson = {
    dependencies: {
      hello: '1.0.0',
      goodbye: '2.0.1'
    }
  };
  const { stubs, PackageJson, c } = setupStubs(t.context, packageJson);
  const pj = new PackageJson(c.location);
  t.deepEqual(pj.getDependencies(), packageJson.dependencies);
});

test('PackageJson - getDependencies - returns empty pobject if no dependencies in package.json', t => {
  const packageJson = {
  };
  const { stubs, PackageJson, c } = setupStubs(t.context, packageJson);
  const pj = new PackageJson(c.location);
  t.deepEqual(pj.getDependencies(), {});
});
