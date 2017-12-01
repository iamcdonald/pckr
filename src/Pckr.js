const pckrPckr = require('./pckrPckr');
const Module = require('./Module');

class Pckr {
  constructor(location) {
    this.module = new Module(location);
  }

  async pack() {
    await pckrPckr.pack();
    await this.module.pack();
    pckrPckr.remove();
    return this.module.getPackagePath();
  }

  async install() {
    await this.module.install()
  }
};

module.exports = Pckr;
