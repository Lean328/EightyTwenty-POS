// Shared-record helpers used by the POS (read-only). Product photo overrides may reference images in the shared
// media library ("media:<id>"); catering package overrides are layered onto the shared CATERING records.
const KEY = 'et-pos-v1:media';
let lib = null;
const read = () => { if (lib) return lib; try { lib = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { lib = []; } return lib; };
const urls = {};
// Served as blob: URLs — data URLs contain ";" which inline style parsing would cut.
const toBlobUrl = (src) => { try { const [h, b64] = src.split(','), type = (h.match(/data:([^;]+)/) || [])[1] || 'image/jpeg', bin = atob(b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return URL.createObjectURL(new Blob([u8], { type })); } catch { return ''; } };
export const resolve = (v) => { if (typeof v !== 'string') return ''; if (!v.startsWith('media:')) return v; const id = v.slice(6); if (urls[id]) return urls[id]; const m = read().find(x => x.id === id); return m ? (urls[id] = toBlobUrl(m.src)) : ''; };

let pkg0 = null;
export function applyPackages(CATERING, edits) {
  if (!pkg0) pkg0 = CATERING.map(p => ({ ...p, items: [...(p.items || [])] }));
  CATERING.forEach((p, i) => { Object.keys(p).forEach(k => delete p[k]); Object.assign(p, pkg0[i], (edits || {})[pkg0[i].id] || {}); });
}
