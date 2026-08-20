# Parent Communication Manager Pro v2 — FIXED

## Why v2 fixes the broken deployment
- CSS is embedded directly inside `index.html`; no external assets/CSS path can fail.
- JavaScript is embedded directly inside `index.html`.
- Dynamic buttons use event delegation, so they keep working after every screen render.
- Sidebar navigation and dashboard quick actions work.
- Add/Edit/Delete students works.
- Templates, New Message, WhatsApp, History, Follow-ups, Announcements, Analytics, Backup, Print and Settings are wired.
- Service-worker cache is versioned to `pcm-v2-fixed`.

## GitHub Pages deployment
Replace the old v1 `index.html`, `manifest.webmanifest`, and `sw.js` with the three files from this ZIP.

If an old blank/unstyled page still appears:
1. Open the GitHub Pages site.
2. Clear that site's browser data/cache once.
3. Reopen the site.

Do not mix v1 and v2 files.
