# Parent Communication Manager Pro v2.1 — AUTOMATED + FIXED

## What is fixed
- All dynamic buttons now work through a single resilient event-delegation layer.
- Template Edit / Duplicate / Delete buttons fixed.
- Student Edit / Archive / Restore / WhatsApp buttons fixed.
- Follow-up Add / Complete / Delete fixed.
- Message Delete fixed.
- PIN Save / Unlock fixed.
- Announcement first-recipient action fixed.
- Automatic save every 15 seconds + on tab hide + before page unload.
- Smart automation scans on app startup and on demand.
- Smart automation creates low-attendance and fee-due alerts.
- Smart automation can create follow-ups automatically.
- Smart automation can create personalized WhatsApp message drafts.
- Existing localStorage data is migrated instead of being discarded.
- Service-worker cache version bumped so the old broken JS is less likely to remain cached.

## Smart automation
The app can automatically:
1. Detect students below the configured attendance threshold.
2. Detect students with fee dues.
3. Detect missing parent phone numbers.
4. Create daily smart alerts.
5. Create one daily follow-up per risk type/student.
6. Prepare personalized message drafts using template variables.

### Important
This is a GitHub Pages / browser-only system. It cannot silently send WhatsApp messages in the background because GitHub Pages has no server-side messaging service. The app prepares the message and opens WhatsApp; the teacher remains in control of sending.

## Upload
Extract this ZIP and upload/replace the complete structure:

index.html
manifest.webmanifest
sw.js
assets/css/style.css
assets/js/app.js
README.md

Do NOT keep an older app.js or style.css that conflicts with these files.

After upload:
1. Commit to main.
2. Wait for GitHub Pages to redeploy.
3. Open the site.
4. If the old screen still appears, clear the site's browser cache/site data once and reload.

GitHub Pages publishes static files directly from the repository, and project sites use the repository path in the URL.
