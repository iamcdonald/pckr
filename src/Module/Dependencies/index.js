const path = require('path');
const fs = require('fs');
const PackageJson = require('../PackageJson');
const options = require('../../options');

const isPathToModule = (name, filepath) => {
  const n = name.split(path.sep)
  const fp = filepath.split(path.sep).slice(-n.length)
  return fp.join(path.sep) === n.join(path.sep)
}

const isModule = modulePath =>
  fs.existsSync(path.resolve(modulePath, 'package.json'));

const isSymlink = path =>
  fs.lstatSync(path).isSymbolicLink();

const isDirectory = src =>
  fs.statSync(src).isDirectory();

const getSubDirsOfFolder = folder =>
  fs.readdirSync(folder)
    .map(subdir => path.resolve(folder, subdir))
    .filter(isDirectory);

const getInstalledDependencies = folder => {
  const dirs = getSubDirsOfFolder(folder);
  const modules = dirs.filter(isModule);
  const subModules = dirs.filter(f => !isModule(f))
    .map(getInstalledDependencies)
    .reduce((agg, modules) => agg.concat(modules), []);
  return modules.concat(subModules);
};

class Dependencies {
  constructor(location) {
    this.location = location;
    this.packageJson = new PackageJson(location);
  }

  hasNodeModulesDirectory() {
    return fs.existsSync(this.getNodeModulesPath());
  }

  getNodeModulesPath() {
    return path.resolve(this.location, 'node_modules');
  }

  get() {
    if (this.hasNodeModulesDirectory()) {
      return getInstalledDependencies(this.getNodeModulesPath());
    }
    return [];
  }

  getSymlinked() {
    const symlinked = this.get()
      .filter(path => isSymlink(path));
    if (options.get().production) {
      const dependencies = Object.keys(this.packageJson.getDependencies())
      return symlinked.filter(path => dependencies.some(name => isPathToModule(name, path)))
    }
    return symlinked
  }
};

module.exports = Dependencies;
