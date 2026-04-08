OfficeGit – Walkthrough

Overview
OfficeGit is a production-ready Version-Controlled Document Management System consisting of:

Backend API — Node.js + Express + MongoDB
Frontend SPA — React + Vite + Tailwind CSS
Chrome Extension — Manifest V3

Features Implemented & Verified
1. Authentication
JWT-based login/register with role selection (viewer, editor, approver)
Middleware-protected APIs
Token persistence in localStorage

<img width="958" height="944" alt="login_page" src="https://github.com/user-attachments/assets/0570429d-19bd-4409-bb99-fd07429e6942" />
Login Page

2. Document Dashboard
Document cards with title, author, version number, commit message
Create new document (text or file upload)
File upload supports .txt and .pdf (max 1MB)

<img width="958" height="944" alt="dashboard_page" src="https://github.com/user-attachments/assets/7fb82d95-db30-4aac-9404-a41057dd1a03" />
Dashboard

3. Document Page with Version Timeline
Left sidebar: version history (latest on top)
Each version shows: number, author, timestamp, message
CURRENT badge on active version
DIFF buttons for comparison selection
Main area: document content viewer/editor

<img width="958" height="944" alt="document_page" src="https://github.com/user-attachments/assets/769f1556-3083-424f-8dfe-eb43a349adbe" />
Document Page

4. Diff Viewer — Inline Mode
Select two versions via DIFF buttons → auto-loads comparison
Red lines with - prefix = removed content
Green lines with + prefix = added content
Stats bar: additions/deletions count

<img width="958" height="944" alt="inline_diff" src="https://github.com/user-attachments/assets/ca2fd34b-901a-4718-bc26-17cb995f2f90" />
Inline Diff

5. Diff Viewer — Side-by-Side Mode
Toggle between Inline and Side-by-Side views
Left panel: old version with red highlights
Right panel: new version with green highlights
Line numbers and author labels

<img width="958" height="944" alt="side_by_side_diff" src="https://github.com/user-attachments/assets/02330bb9-e910-44ae-ab40-25acbdee00fe" />
Side-by-Side Diff

6. Rollback
Click version → Rollback button appears
Confirmation dialog with backdrop blur
Creates NEW version with old content (immutable history)
Message: "[Rollback] Reverted to version N"

<img width="958" height="944" alt="rollback_dialog" src="https://github.com/user-attachments/assets/3679acb1-8e1f-4fe8-931f-513ea8c5f190" />
Rollback Confirmation

7. Audit Trail
Every action logged: CREATE, EDIT, ROLLBACK, APPROVE
Color-coded action badges with emoji icons
Shows user, timestamp, commit message, version number
Paginated

<img width="958" height="944" alt="audit_trail" src="https://github.com/user-attachments/assets/ee967886-30a0-4e1f-a906-b300e9943dc5" />
Audit Trail

8. Chrome Extension
Manifest V3 with popup, options page, and background service worker
Options page: configure server URL + login credentials
Popup: file picker, title, commit message → upload directly to backend
File validation (.txt/.pdf, max 1MB)

How to Run
Prerequisites
Node.js 18+
MongoDB running locally on port 27017

Backend
cd server
npm install
npm run dev    # starts on http://localhost:5000

Frontend
cd client
npm install
npm run dev    # starts on http://localhost:5173


