// App CMS media + shared-record helpers (mock). Uploaded images are compressed in the browser and kept in
// localStorage as data URLs (one copy each); content stores a "media:<id>" reference. Browser storage is ~5 MB,
// so a full library may not survive a reload — add() reports that. A backend would replace this with an asset store.
const KEY = 'et-pos-v1:media';
let lib = null;
const read = () => { if (lib) return lib; try { lib = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { lib = []; } return lib; };
const write = () => { try { localStorage.setItem(KEY, JSON.stringify(lib)); return true; } catch { return false; } };

export const uploads = () => read();
// Uploads are served as blob: URLs — data URLs contain ";" which inline style parsing would cut.
const urls = {};
const toBlobUrl = (src) => { try { const [h, b64] = src.split(','), type = (h.match(/data:([^;]+)/) || [])[1] || 'image/jpeg', bin = atob(b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return URL.createObjectURL(new Blob([u8], { type })); } catch { return ''; } };
export const resolve = (v) => { if (typeof v !== 'string') return ''; if (!v.startsWith('media:')) return v; const id = v.slice(6); if (urls[id]) return urls[id]; const m = read().find(x => x.id === id); return m ? (urls[id] = toBlobUrl(m.src)) : ''; };
export const isUpload = (v) => typeof v === 'string' && v.startsWith('media:');
export function add(item) { lib = [item, ...read()]; return write(); }
export function remove(id) { lib = read().filter(x => x.id !== id); if (urls[id]) { URL.revokeObjectURL(urls[id]); delete urls[id]; } write(); }
export const usedKB = () => Math.round((localStorage.getItem(KEY) || '').length / 1024);

const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
/** Validate, decode and downscale a chosen file. Resolves { src, w, h, name, kb } or rejects with a readable message. */
export function prepare(file, maxPx = 1600) {
  return new Promise((ok, fail) => {
    if (!file) return fail('No file chosen.');
    if (!TYPES.includes(file.type)) return fail('Use a JPG, PNG or WebP image.');
    if (file.size > 15e6) return fail('That file is over 15 MB. Choose a smaller image.');
    const url = URL.createObjectURL(file), img = new Image();
    img.onerror = () => { URL.revokeObjectURL(url); fail('This file can’t be read as an image.'); };
    img.onload = () => {
      URL.revokeObjectURL(url);
      const w0 = img.naturalWidth, h0 = img.naturalHeight;
      if (Math.min(w0, h0) < 300) return fail(`This image is ${w0} × ${h0} px. Use one at least 300 px on each side.`);
      const k = Math.min(1, maxPx / Math.max(w0, h0)), w = Math.round(w0 * k), h = Math.round(h0 * k);
      const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h);
      let src = c.toDataURL('image/webp', 0.84);
      if (!src.startsWith('data:image/webp')) src = file.type === 'image/png' ? c.toDataURL('image/png') : c.toDataURL('image/jpeg', 0.84);
      ok({ src, w, h, w0, h0, name: file.name.replace(/\.[^.]+$/, ''), kb: Math.round(src.length * 0.75 / 1024) });
    };
    img.src = url;
  });
}

// Shared catering packages: published CMS edits are layered onto the shared records so POS Catering,
// the website preview and the app all read the same values. Originals are kept for restore.
let pkg0 = null;
export function applyPackages(CATERING, edits) {
  if (!pkg0) pkg0 = CATERING.map(p => ({ ...p, items: [...(p.items || [])] }));
  CATERING.forEach((p, i) => { Object.keys(p).forEach(k => delete p[k]); Object.assign(p, pkg0[i], (edits || {})[pkg0[i].id] || {}); });
}
export const originalPackage = (id) => (pkg0 || []).find(p => p.id === id);
