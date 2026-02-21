const Storage = {
  get(key, fallback = null) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  },

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  clearAll() {
    localStorage.clear();
  }
};