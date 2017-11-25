const npm = require('./npm');

const pack = async modulePath => {
  return npm.pack(modulePath);
};

module.exports = {
  pack
};


