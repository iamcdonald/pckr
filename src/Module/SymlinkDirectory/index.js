const path = require('path');
const fse = require('fs-extra');

const SYM_DEPS_DIR = 'sym-deps'
const PCKR_REG_EX = /.*pckr-(\d\.){3}tgz/;

const relativeTo = base => filePath => `./${path.relative(base, filePath)}`;

const isPckrFile = filePath => PCKR_REG_EX.test(filePath);

class SymlinkDirectory {
  constructor(location) {
    this.location = location;
  }

  getPath() {
    return path.resolve(this.location, SYM_DEPS_DIR);
  }

  getPckrPath() {
    return this.getFilePaths()
      .find(isPckrFile);
  }

  create() {
    fse.mkdirSync(this.getPath());
  }

  remove() {
    fse.removeSync(this.getPath());
  }

  addFile(file) {
    const filename = path.basename(file);
    const toLocation = path.resolve(this.getPath(), filename);
    fse.renameSync(file, toLocation);
    return toLocation;
  }

  copyFile(file, name) {
    name = name || path.basename(file);
    const toLocation = path.resolve(this.getPath(), name);
    fse.copyFileSync(file, toLocation);
    return toLocation;
  }

  getFilePaths() {
    return fse.readdirSync(this.getPath())
      .map(fp => path.resolve(this.getPath(), fp))
      .map(relativeTo(this.location));
  }

  getSymlinkFilePaths() {
    return this.getFilePaths()
      .filter(fp => !isPckrFile(fp));
  }
};

module.exports = SymlinkDirectory
