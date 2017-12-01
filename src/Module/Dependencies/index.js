const path = require('path');
const fs = require('fs');

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
    return this.get()
      .filter(path => isSymlink(path));
  }
};

module.exports = Dependencies;
