# Parent Communication Manager Pro v2 Advanced

GitHub Pages-ready, local-first teacher productivity system.

## 50+ features
1. Dashboard KPI cards
2. Live date/time
3. Student CRUD
4. Parent/guardian contacts
5. WhatsApp phone field
6. Email field
7. Class/section field
8. Roll number
9. Attendance percentage
10. Configurable low-attendance threshold
11. Fee due tracking
12. Student DOB
13. Student tags
14. Student notes
15. Student search
16. Student filters
17. Archive students
18. Restore archived students
19. Multi-select students
20. Bulk-message preparation
21. Reusable templates
22. Template variables
23. Template edit
24. Template duplicate
25. Template delete
26. Live message preview
27. Copy message
28. WhatsApp opener
29. Message history
30. History search
31. History status filter
32. Delete history records
33. Communication types
34. Class-based announcements
35. All-parent announcements
36. Announcement history
37. Follow-up tracker
38. Overdue follow-up alerts
39. Complete follow-up
40. Delete follow-up
41. Notification panel
42. Communication analytics
43. Six-month message chart
44. Message-type analytics
45. Class attendance overview
46. Contact coverage analytics
47. Total fee-due analytics
48. JSON backup
49. JSON restore
50. Student CSV export
51. Student CSV import
52. Printable directory
53. Printable communication history
54. Dark mode
55. Local PIN lock
56. Auto-save preference
57. Demo-data loader
58. Full app reset
59. Keyboard shortcuts
60. Offline PWA/service-worker support
61. Mobile responsive navigation
62. Toast feedback
63. Form validation
64. Recent activity timeline
65. Local storage usage indicator

## File structure

```text
index.html
manifest.webmanifest
sw.js
assets/
  css/
    style.css
  js/
    app.js
README.md
```

## GitHub Pages deployment

Upload the files exactly in the structure above. Do not flatten `assets/css/style.css` or `assets/js/app.js`.

`index.html` loads:
- `./assets/css/style.css`
- `./assets/js/app.js`

The service worker cache is versioned as `pcm-pro-v2-advanced`.

### Important after replacing an old version

Because service workers can keep old files cached, if an old screen still appears:
1. Open the GitHub Pages site.
2. Clear that site's browser data/cache once.
3. Reopen the site.

## Data model

All app data is stored locally in the browser under `pcm_pro_v2`. Export JSON regularly if the data matters.
