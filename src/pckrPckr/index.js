const fs = require('fs');
const path = require('path');
const npm = require('../npm');

let PCKR_PATH;

const pack = async () => {
  PCKR_PATH = await npm.pack(path.resolve(__dirname, '../../'));
}

const remove = () => fs.unlinkSync(PCKR_PATH);

const getPath = () => PCKR_PATH;

module.exports = {
  pack,
  remove,
  getPath
};
