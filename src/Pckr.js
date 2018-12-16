const pckrPckr = require('./pckrPckr');
const Module = require('./Module');
const options = require('./options')

class Pckr {
  constructor(location, opts) {
    options.set(opts);
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
