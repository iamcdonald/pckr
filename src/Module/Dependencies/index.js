const path = require('path');
const fs = require('fs');

const isModule = modulePath =>
  fs.existsSync(path.resolve(modulePath, 'package.json'));

const isSymlink = path =>
  fs.lstatSync(path).isSymbolicLink();

const isDirectory = src =>
  fs.statSync(src).isDirectory();

const getPackageName = modulePath => {
  const package = fs.readFileSync(path.resolve(modulePath, 'package.json'));
  const packageJson = JSON.parse(package);
  return packageJson.name;
};

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

  getSymlinked(packageJson) {
    let productionDependencies;
    if (packageJson) {
      productionDependencies = Object.keys(packageJson.getDependencies() || {});
    }

    const symlinked = this.get().filter(path => isSymlink(path));

    if (productionDependencies) {
      return symlinked.filter(path =>
        productionDependencies.includes(getPackageName(path))
      );
    }

    return symlinked;
  }
}

module.exports = Dependencies;
