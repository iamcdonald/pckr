const test = require('ava');
const { add } = require('../src/add');

test(t => {
  t.is(add(1, 6), 7);
});
