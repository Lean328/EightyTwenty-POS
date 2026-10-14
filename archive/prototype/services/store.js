// Tiny persistence layer. Swap for API calls during integration; keep the same function shapes.
const NS = 'et-pos-v1:';
export const load = (k, fb) => { try { const v = localStorage.getItem(NS + k); return v == null ? fb : JSON.parse(v); } catch { return fb; } };
export const save = (k, v) => { try { localStorage.setItem(NS + k, JSON.stringify(v)); } catch {} };

export const uid = (p = '') => p + Math.random().toString(36).slice(2, 7).toUpperCase();
export const nowHM = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
export const stamp = () => new Date().toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

let seq = load('orderSeq', 4471);
export const nextOrderNo = () => { seq += 1; save('orderSeq', seq); return `#8020-${seq}`; };
