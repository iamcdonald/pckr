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

  stubs.path.relative = (a, b) => b.replace(`${a}/`, '');

  const SymlinkDirectory = require('../../../../src/Module/SymlinkDirectory');

  return { stubs, SymlinkDirectory };
};

const teardown = () => {
  td.reset()
};

test.beforeEach(t => {
  t.context = setup();
});

test.afterEach.always(teardown);

test('SymlinkDirectory - constructor - returns instance with modulePath set', t => {
  const { SymlinkDirectory } = t.context;
  const location = '/a/b/c'
  const sd = new SymlinkDirectory(location);
  t.is(sd.location, location);
});

test('SymlinkDirectory - getPath - returns directory path', t => {
  const { SymlinkDirectory } = t.context;
  const location = '/a/b/c'
  const sd = new SymlinkDirectory(location);
  t.is(sd.getPath(), `${location}/sym-deps`);
});

test('SymlinkDirectory - create - creates directory', t => {
  t.plan(0);
  const { SymlinkDirectory, stubs } = t.context;
  const location = '/a/b/c'
  const sd = new SymlinkDirectory(location);
  sd.create();
  td.verify(stubs.fse.mkdirSync(`${location}/sym-deps`));
});

test('SymlinkDirectory - remove - remove directory', t => {
  t.plan(0);
  const { SymlinkDirectory, stubs } = t.context;
  const location = '/a/b/c'
  const sd = new SymlinkDirectory(location);
  sd.remove();
  td.verify(stubs.fse.removeSync(`${location}/sym-deps`));
});

test('SymlinkDirectory - addFile - when no name provided - moves file to sym-deps directory under same name', t => {
  t.plan(0);
  const { SymlinkDirectory, stubs } = t.context;
  const location = '/a/b/c'
  const file = '/a/file/here-0.0.0.tgz';
  td.when(stubs.path.basename(file)).thenReturn('here-0.0.0.tgz');
  const sd = new SymlinkDirectory(location);
  sd.addFile(file);
  td.verify(stubs.fse.renameSync(file, `${location}/sym-deps/here-0.0.0.tgz`));
});

test('SymlinkDirectory - addFile - when name provided - copies file to sym-deps directory under provided name', t => {
  t.plan(0);
  const { SymlinkDirectory, stubs } = t.context;
  const location = '/a/b/c'
  const file = '/a/file/here-0.0.0.tgz';
  const name = 'a-name.tgz';
  td.when(stubs.path.basename(file)).thenReturn('here-0.0.0.tgz');
  const sd = new SymlinkDirectory(location);
  sd.addFile(file, name);
  td.verify(stubs.fse.renameSync(file, `${location}/sym-deps/a-name.tgz`));
});

test('SymlinkDirectory - copyFile - when no name provided - copies file to sym-deps directory under same name', t => {
  t.plan(0);
  const { SymlinkDirectory, stubs } = t.context;
  const location = '/a/b/c'
  const file = '/a/file/here-0.0.0.tgz';
  td.when(stubs.path.basename(file)).thenReturn('here-0.0.0.tgz');
  const sd = new SymlinkDirectory(location);
  sd.copyFile(file);
  td.verify(stubs.fse.copyFileSync(file, `${location}/sym-deps/here-0.0.0.tgz`));
});

test('SymlinkDirectory - copyFile - when name provided - copies file to sym-deps directory under provided name', t => {
  t.plan(0);
  const { SymlinkDirectory, stubs } = t.context;
  const location = '/a/b/c'
  const file = '/a/file/here-0.0.0.tgz';
  const name = 'a-name.tgz';
  td.when(stubs.path.basename(file)).thenReturn('here-0.0.0.tgz');
  const sd = new SymlinkDirectory(location);
  sd.copyFile(file, name);
  td.verify(stubs.fse.copyFileSync(file, `${location}/sym-deps/a-name.tgz`));
});

test('SymlinkDirectory - getFilePaths - when directory exists - returns files in directory', t => {
  t.plan(3);
  const { SymlinkDirectory, stubs } = t.context;
  const location = '/a/b/c'
  const files = [
    'file-1.tgz',
    'file-2.tgz',
    'file-3.tgz'
  ];
  td.when(stubs.fse.existsSync(`${location}/sym-deps`)).thenReturn(true);
  td.when(stubs.fse.readdirSync(`${location}/sym-deps`)).thenReturn(files);
  const sd = new SymlinkDirectory(location);
  const retrievedFiles = sd.getFilePaths();
  retrievedFiles.forEach((f, idx) => {
    t.is(f, `./sym-deps/${files[idx]}`);
  });
});

test('SymlinkDirectory - getFilePaths - when directory exists - returns files in directory', t => {
  const { SymlinkDirectory, stubs } = t.context;
  const location = '/a/b/c'
  const files = [
    'file-1.tgz',
    'file-2.tgz',
    'file-3.tgz'
  ];
  td.when(stubs.fse.existsSync(`${location}/sym-deps`)).thenReturn(false);
  td.when(stubs.fse.readdirSync(`${location}/sym-deps`)).thenReturn(files);
  const sd = new SymlinkDirectory(location);
  const retrievedFiles = sd.getFilePaths();
  t.deepEqual(retrievedFiles, []);
});

test('SymlinkDirectory - getSymlinkFiles - returns all files in directory except those matching pckr name', t => {
  t.plan(3);
  const { SymlinkDirectory, stubs } = t.context;
  const location = '/a/b/c'
  const files = [
    'file-1.tgz',
    'file-2.tgz',
    'pckr-0.1.0.tgz',
    'file-3.tgz',
    'pckr-1.0.0.tgz'
  ];
  td.when(stubs.fse.existsSync(`${location}/sym-deps`)).thenReturn(true);
  td.when(stubs.fse.readdirSync(`${location}/sym-deps`)).thenReturn(files);
  const sd = new SymlinkDirectory(location);
  const retrievedFiles = sd.getSymlinkFilePaths();
  const expectedFiles = [
    files[0],
    files[1],
    files[3]
  ];
  retrievedFiles.forEach((f, idx) => {
    t.is(f, `./sym-deps/${expectedFiles[idx]}`);
  });
})
test('SymlinkDirectory - getPckrPath - returns file matching pckr file name from files in directory', t => {
  const { SymlinkDirectory, stubs } = t.context;
  const location = '/a/b/c'
  const files = [
    'file-1.tgz',
    'pckr-2.0.0-alpha.tgz',
    'file-3.tgz'
  ];
  td.when(stubs.fse.existsSync(`${location}/sym-deps`)).thenReturn(true);
  td.when(stubs.fse.readdirSync(`${location}/sym-deps`)).thenReturn(files);
  const sd = new SymlinkDirectory(location);
  t.is(sd.getPckrPath(), `./sym-deps/pckr-2.0.0-alpha.tgz`);
});
