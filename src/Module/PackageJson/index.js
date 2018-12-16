const path = require('path');
const fse = require('fs-extra');

const loadJson = path => JSON.parse(fse.readFileSync(path));

class PackageJson {
  constructor(location) {
    this._packageJsonPath = path.resolve(location, 'package.json');
    this._tempPackageJsonPath = path.resolve(location, 'package.tmp.json');
    this._packageJson = loadJson(this._packageJsonPath);
    this.name = this._packageJson.name;
    this.version = this._packageJson.version;
  }

  getName() {
    return this._packageJson.name;
  }

  getVersion() {
    return this._packageJson.version;
  }

  getDependencies() {
    return this._packageJson.dependencies;
  }

  updateScripts(scripts) {
    this._packageJson.scripts = Object.keys(scripts)
      .reduce((existingScripts, key) => {
        const existing = existingScripts[key];
        existingScripts[key] = scripts[key];
        if (existing) {
          existingScripts[key] += ` && ${existing}`;
        }
        return existingScripts;
      }, this._packageJson.scripts);
  }

  removeDependency(dependency) {
    this._packageJson.devDependencies && delete this._packageJson.devDependencies[dependency];
    this._packageJson.dependencies && delete this._packageJson.dependencies[dependency];
  }

  replace() {
    fse.renameSync(this._packageJsonPath, this._tempPackageJsonPath);
    fse.writeFileSync(this._packageJsonPath, JSON.stringify(this._packageJson, null, '\t'));
  }

  restore() {
    fse.renameSync(
        this._tempPackageJsonPath,
        this._packageJsonPath
      );
  }
};

module.exports = PackageJson;
