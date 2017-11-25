const FakeFileTree = {
  init (dir) {
    this._dir = dir;
  },
  getBase () {
    return Object.keys(this._dir)[0];
  },
  find (path) {
    path = path.split(/\//);
    return path.reduce((agg, p) => {
      return (agg.children || [])[p];
    }, { children: this._dir });
  },
  getChildren (path) {
    const el = this.find(path);
    return Object.keys(el.children || []);
  }
};

const create = dir => {
  const fft = Object.create(FakeFileTree);
  fft.init(dir);
  return fft;
};

module.exports = {
  create
};
