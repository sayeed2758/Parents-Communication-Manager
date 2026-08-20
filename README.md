# Parent Communication Manager Pro v2

GitHub Pages compatible, mobile-first, local-first teacher-parent communication app.

## Upload
Extract this ZIP and upload the **contents** into the repository root. `index.html` must be directly at the repository root.

## Structure
- Core: `index.html`, `404.html`, `manifest.webmanifest`, `sw.js`
- CSS: global + dedicated feature styles + print styles
- JS: core files plus dedicated feature module files named by the roadmap
- Data: default templates and module manifest
- Icons: PWA icons

## Stability rules
- Core storage key remains `pcm_pro_v2`.
- Integration bridge reads external manager keys without overwriting them.
- Feature module files are namespaced and safe to wire into the core later.
- Existing core app code is preserved while modular roadmap files are added.

## Validation performed
- All JavaScript files checked with Node syntax validation.
- All JSON files parsed successfully.
- All index CSS/JS asset references checked for existence.
- Required roadmap filenames verified.
- PNG icons generated as valid files.
