const store = new Map();

class MMKV {
  getString(key) { return store.get(key); }
  set(key, value) { store.set(key, value); }
  delete(key) { store.delete(key); }
  contains(key) { return store.has(key); }
  getAllKeys() { return [...store.keys()]; }
  clearAll() { store.clear(); }
}

module.exports = { MMKV };
