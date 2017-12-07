const path = require('path');
const fse = require('fs-extra');
const npm = require('../npm');
const { execSync } = require('child_process');
const Dependencies = require('./Dependencies');
const SymlinkDirectory = require('./SymlinkDirectory');
const PackageJson = require('./PackageJson');
const pckrPckr = require('../pckrPckr');

class Module {
  constructor(location, root = false) {
    this.location = location;
    this.root = root;
    this.packageJson = new PackageJson(location);
    this.dependencies = new Dependencies(location);
    this.symlinkDirectory = new SymlinkDirectory(location);
  }

  _setup() {
    this.symlinkDirectory.create();
    if (this.root) {
      this.symlinkDirectory.copyFile(pckrPckr.getPath());
    }
  }

  _clean() {
    this.packageJson.restore();
    this.symlinkDirectory.remove();
  }

  _rewritePackageJson(modules) {
    if (this.root) {
      this.packageJson.updateScripts({
        postinstall: `npm install ${this.symlinkDirectory.getPckrPath()} && pckr install && npm dedupe --ignore-scripts`
      });
    } else {
      this.packageJson.updateScripts({
        postinstall: `pckr install`
      });
    }
    modules.forEach(mod => this.packageJson.removeDependency(mod.packageJson.getName()));
    this.packageJson.replace();
  }

  _getSymlinkedDependenciesAsModules() {
    return this.dependencies.getSymlinked()
      .map(location => new Module(location));
  }

  async _packModules(modules) {
    for (let module of modules) {
      await module.pack();
      this.symlinkDirectory.addFile(module.getPackagePath())
    }
  }

  async _package() {
    const currentLocation = await npm.pack(this.location);
    this.filename = path.basename(currentLocation);
    fse.renameSync(currentLocation, this.getPackagePath());
  }

  async pack() {
    this._setup();
    const symlinkModules = this._getSymlinkedDependenciesAsModules();
    await this._packModules(symlinkModules);
    this._rewritePackageJson(symlinkModules);
    this.packedLocation = await this._package();
    this._clean();
  }

  getPackagePath() {
    if (!this.filename) {
      throw new Error('Module not yet packed');
    }
    return path.resolve(this.location, this.filename);
  }

  async install() {
    return Promise.all(
      this.symlinkDirectory.getSymlinkFilePaths()
        .map(file => npm.installFileToModule(file, this.location))
    );
  }
};

module.exports = Module;
