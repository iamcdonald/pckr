const path = require('path');
const fse = require('fs-extra');
const npm = require('../npm');
const { execSync } = require('child_process');
const Dependencies = require('./Dependencies');
const SymlinkDirectory = require('./SymlinkDirectory');
const PackageJson = require('./PackageJson');
const pckrPckr = require('../pckrPckr');
const options = require('../options');

const buildModuleDependenciesTree = (m, level = 1) => ({
  module: m,
  level: level,
  deps: m.dependencies.getSymlinked()
    .map(location => new Module(location))
    .map(m => buildModuleDependenciesTree(m, level + 1))
});

const flatten = m => [{module: m.module, level: m.level }].concat(m.deps.map(flatten).reduce((acc, m) => acc.concat(m), []));

const byLevelAscending = (a, b) => b.level - a.level;

const removeDuplicates = (m, idx, a) => {
  if (idx === 0) {
    return true;
  }
  return !a.slice(0, idx).find(om => om.module.packageJson.getName() === m.module.packageJson.getName());
};

const getPriorityOrderSymlinkedDependencies = m => flatten(buildModuleDependenciesTree(m))
  .slice(1)
  .sort(byLevelAscending)
  .filter(removeDuplicates)
  .map(m => m.module);

const getFileName = fp => path.basename(fp);

const LEVEL = /^(\d*)/;

const sortByLevelInFileNameAscending = (a, b) => {
  const af = getFileName(a).match(LEVEL);
  const bf = getFileName(b).match(LEVEL);
  return parseInt(af, 10) - parseInt(bf, 10);
};

class Module {
  constructor(location, root = false) {
    this.location = location;
    this.root = root;
    this.packageJson = new PackageJson(location);
    this.dependencies = new Dependencies(location);
    this.symlinkDirectory = new SymlinkDirectory(location);
  }

  _packDependencies() {
    this.symlinkDirectory.create();
    this.symlinkDirectory.copyFile(pckrPckr.getPath());
    getPriorityOrderSymlinkedDependencies(this).forEach((module, idx) => {
      module.pack();
      this.symlinkDirectory.addFile(module.getPackagePath(), `${idx}.${module.filename}`)
      this.packageJson.removeDependency(module.packageJson.getName());
    });
    this.packageJson.updateScripts({
      postinstall: `npm install ${this.symlinkDirectory.getPckrPath()} && pckr install`
    });
    if (options.get().production) {
      this.packageJson.removeDevDependencies();
    }
    this.packageJson.replace();
  }

  _clean() {
    this.packageJson.restore();
    this.symlinkDirectory.remove();
  }

  pack() {
    if (this.root) {
      this._packDependencies()
    }
    this.filename = npm.pack(this.location);
    if (this.root) {
      this._clean();
    }
  }

  getPackagePath() {
    if (!this.filename) {
      throw new Error('Module not yet packed', this.location);
    }
    return path.resolve(this.location, this.filename);
  }

  install() {
    this.symlinkDirectory.getSymlinkFilePaths()
      .sort(sortByLevelInFileNameAscending)
      .forEach(file => npm.installFileToModule(file, this.location))
  }
};

module.exports = Module;
