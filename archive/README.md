# Archive — not part of the POS application

Nothing in this folder is built, deployed, linted or type-checked. It is kept for reference and rollback.

| Folder | Contents |
| ------ | -------- |
| `prototype/` | The approved prototype exactly as delivered: `POS.dc.html`, the Fable dc-runtime `support.js`, `data/`, `services/`. Source of truth for the conversion; `src/domain/legacy-parity.test.ts` runs these services to prove the new code gives identical results. To view it, copy `public/assets`, `public/img-pos` and `unused-assets/img-pos` next to `POS.dc.html` and serve that folder over HTTP (it loads React and Babel from unpkg). |
| `bos-cms/` | Archived BOS / App CMS and Web CMS code and data. Not used by the POS. |
| `unused-assets/` | Images no longer referenced by the POS: App / Web / CMS navigation icons, `img-pos/app`, `img-pos/site`, `img-pos/catering`. |
| `design-references/` | Screenshots and uploaded design images from the design process. |
