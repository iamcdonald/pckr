const defaultOptions = {
  production: false
}

let options = defaultOptions;

const set = opts => options = Object.assign({}, options, opts)

const get = () => options;

module.exports = {
  set,
  get
}
