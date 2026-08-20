# Parent Communication Manager Pro

A standalone, local-first teacher communication web app.

## Included
- Student & parent directory
- Smart message composer
- Dynamic message variables
- WhatsApp pre-filled sharing
- Communication history
- Follow-up manager
- Announcements
- Analytics
- JSON backup/restore
- CSV export
- Printable reports
- Dark/light theme
- Responsive mobile UI
- Attendance and fee context fields
- Integration-ready structure for future Result/Attendance/Fee modules

## Run
Open `index.html` in a browser or deploy the folder to GitHub Pages.

## Important
This build stores data in browser localStorage. Regularly export a JSON backup.
WhatsApp sharing uses the normal `wa.me` web flow; it does not perform unattended bulk sending.

## Future integration contract
When connecting another module, keep the student `id` stable and map:
- attendance -> `student.attendance`
- fee due -> `student.feeDue`
- result data -> future result adapter

Do not replace the storage key `pcm_pro_v1` without a migration plan.
