const fs = require('fs');
const path = require('path');
const npm = require('../npm');

let PCKR_PATH;

const pack = () => {
  const pckrPath = path.resolve(__dirname, '../../');
  const pckrName = npm.pack(pckrPath);
  PCKR_PATH = path.resolve(pckrPath, pckrName);
};

const remove = () => fs.unlinkSync(PCKR_PATH);

const getPath = () => PCKR_PATH;

module.exports = {
  pack,
  remove,
  getPath
};
