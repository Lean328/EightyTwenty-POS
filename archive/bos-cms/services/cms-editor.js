// CMS editor state machine (mock). One document per website page / app screen:
//   pub   — what customers see (published)     draft — saved but not published
//   work  — unsaved edits in this browser        versions — earlier published snapshots
// Publishing is simulated: it updates this prototype's stored content only.
export const blank = () => ({ v: {}, hidden: {}, order: null });
export const clone = (x) => JSON.parse(JSON.stringify(x));
export const docKey = (plat, page) => plat + ':' + page;

export function ensure(docs, key) { return docs[key] || { pub: blank(), draft: null, work: null, versions: [], pubAt: '', failed: false, reverted: false }; }
export const current = (d) => d.work || d.draft || d.pub;

export function edit(d, fn) { const work = clone(current(d)); fn(work); return { ...d, work, failed: false, reverted: false }; }
export function saveDraft(d) { return d.work ? { ...d, draft: d.work, work: null, reverted: false } : d; }
export function publish(d, by, at) {
  const src = d.work || d.draft; if (!src) return d;
  return { ...d, versions: [{ at: d.pubAt || 'Original', by: d.pubBy || 'EightyTwenty', snap: d.pub }, ...d.versions].slice(0, 12), pub: src, draft: null, work: null, pubAt: at, pubBy: by, failed: false, reverted: false };
}
export function fail(d) { return { ...d, draft: d.work || d.draft, work: null, failed: true }; }
export function discard(d) { return d.work ? { ...d, work: null, reverted: true } : { ...d, draft: null, reverted: true }; }
export function restore(d, i) { return { ...d, work: clone(d.versions[i].snap), reverted: false, failed: false }; }

export function status(d) {
  if (d.work) return ['Unsaved changes', '#8B5827'];
  if (d.failed) return ['Publish failed — draft kept', '#9A4436'];
  if (d.draft) return ['Draft saved · not published', '#8B5827'];
  if (d.reverted) return ['Reverted to the published version', '#574A40'];
  if (d.pubAt) return ['Published ' + d.pubAt, '#3E6B47'];
  return ['No changes', '#8C7A6E'];
}
