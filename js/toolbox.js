
'use strict';
window.DerpToolbox = (() => {
  const KEY = 'derpedit.toolbox.v1';
  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch { return []; }
  }
  function write(items) { localStorage.setItem(KEY, JSON.stringify(items)); }
  function save(asset) {
    const items = read();
    const copy = JSON.parse(JSON.stringify(asset));
    copy.toolboxId = copy.toolboxId || (Date.now().toString(36) + Math.random().toString(36).slice(2));
    items.push(copy); write(items); return copy;
  }
  function clear() { localStorage.removeItem(KEY); }
  return { read, write, save, clear };
})();
