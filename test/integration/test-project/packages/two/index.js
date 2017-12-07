const three = require('three-x-x');
const four = require('@nsp/four-x-x');
const five = require('five-x-x');
const leftPad = require('left-pad');

module.exports = () => ['two', three(), four(), five(), leftPad(1, 3, 0)];
