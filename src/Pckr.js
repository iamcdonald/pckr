const pckrPckr = require('./pckrPckr');
const Module = require('./Module');

class Pckr {
  constructor(location) {
    this.module = new Module(location, true);
  }

  pack() {
    pckrPckr.pack();
    this.module.pack();
    pckrPckr.remove();
    return this.module.getPackagePath();
  }

  install() {
    this.module.install()
  }
};

module.exports = Pckr;
