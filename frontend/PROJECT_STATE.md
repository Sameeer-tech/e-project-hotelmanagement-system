# PROJECT STATE — LuxuryStay Hotel Management System (MERN)

Rule for any AI assistant (Cursor, Copilot, Windsurf, Claude Code, etc.):

Read this ENTIRE file before writing or changing any code.
Only do the task described in the prompt you were given — don't build extra modules.
When you finish, UPDATE this file: move the task from "In Progress" to "Completed", update "File Structure", add any new API endpoints/pages, note any issues in "Known Issues", and update "Last Updated".
Keep code simple, readable, and well-commented (this is a student project, not production-grade).

---

## 1. Project Summary

MERN stack Hotel Management System for a fictional hotel chain "LuxuryStay Hospitality". Core modules: User/Staff/Guest management, Room management, Reservation & Check-in/out, Billing & Invoicing, Housekeeping & Maintenance, Reporting, Feedback, System Settings.

## 2. Tech Stack
Frontend: React (functional components + hooks), React Router, Axios, Tailwind CSS, Recharts, Lucide React icons
Backend: Node.js, Express.js (STEP 1, 2, 3 DONE: scaffold + DB conn + /api/health + User Auth + Room Mgmt CRUD)
Database: MongoDB (Mongoose) (User + Room models live; booking/billing/hk/etc. models pending)
Auth: JWT + bcrypt (frontend auth context + backend auth API both built)
Roles: admin, manager, receptionist, housekeeping, guest

## 3. Completed Modules
- Frontend auth context (AuthContext) with login/register/logout + JWT token storage
- Frontend API helper (api.js) with Axios instance pointed at http://localhost:5000/api/
- Login & Register pages with role selection
- Main Layout with Sidebar navigation + Header with role switcher
- React Router shell (App.jsx) FULLY IMPLEMENTED: AuthProvider wrapping, public /login + /register routes, ProtectedRoute role guards, all 13 pages wired to dedicated URLs, role-based index redirects, and backward-compat legacy portal routes
- Admin Dashboard page (overview KPIs, revenue chart preview, emergency alerts)
- Staff Management page (add/edit/deactivate staff table with modal form)
- System Settings page (tax rate, price override, cancellation policy, emergency alert)
- Room Management page (room table with add/edit form, status badges)
- Room Booking / Reservation page (date range search, room selection, confirmation)
- Check-in / Check-out page (today's reservations list with action buttons)
- Billing & Invoice page (bill breakdown with room + extras, HTML invoice view/print)
- Housekeeping page (room cleaning list, mark cleaned, maintenance report form)
- Reports page (Recharts bar/line/pie charts for occupancy rate & revenue)
- Feedback page (guest submission form + admin feedback table)
- Additional Services page (room service, wake-up call, transport request forms)
- Guest Profile page (personal info, contact, preferences, booking history)
- **Backend Step 1 — Project Setup & DB Connection:** backend/ npm project initialized, 7 packages installed (express, mongoose, dotenv, cors, bcryptjs, jsonwebtoken, nodemon@dev), .env with PORT/MONGO_URI/JWT_SECRET placeholders, config/db.js (mongoose connect helper), server.js (express entry + express.json() + cors() + connectDB() + listener on PORT=5000), folder scaffold (models/, routes/, controllers/, middleware/), GET /api/health → {status: "ok"} verified.
- **Backend Step 2 — User Authentication (Admin/Staff/Guest):** Created `models/User.js` (fields: name String, email String unique, password String [bcrypt hashed via pre('save') hook], role enum[admin|manager|receptionist|housekeeping|guest] default=guest, phone String, createdAt Date default=now). Created `controllers/authController.js` with register() (201 → JWT + user w/o password, 7-day token expiry, catches duplicate-email 11000 code + ValidationError) + login() (finds user + matchPassword) + bonus getMe(). Created `middleware/authMiddleware.js` with protect() (reads Bearer <token> header, verifies JWT w/ JWT_SECRET, loads user doc → attaches req.user) + authorize(...roles) (higher-order fn; 403 if req.user.role not in allowed list). Created `routes/authRoutes.js`: POST /register public, POST /login public, GET /me protected. Mounted authRoutes at /api/auth in server.js. 27/27 test scenarios passed incl. register 201, duplicate email 400, login 200, wrong pass 401, /me 200 with token, /me 401 no/garbage token, guest default role.
- **Backend Step 3 — Room Management:** Created `models/Room.js` (fields: roomNumber String unique required, type enum[single|double|suite|deluxe] required, pricePerNight Number required min=0, status enum[available|occupied|cleaning|maintenance] default='available', description String optional, createdAt Date default=now). Created `controllers/roomController.js` with 6 handlers: createRoom (201, catches E11000 duplicate roomNumber + ValidationError), getAllRooms (supports ?type= and ?status= query filters, sorted by roomNumber ASC), getRoomById (CastError → 404), updateRoom (findByIdAndUpdate w/ returnDocument:'after' + runValidators), deleteRoom, updateRoomStatus (dedicated PATCH; missing status → 400, invalid status → 400). Created `routes/roomRoutes.js`: GET / + GET /:id protected only (any logged-in user can read); POST / + PUT /:id + DELETE /:id + PATCH /:id/status protected + authorize('admin','manager'). Mounted roomRoutes at /api/rooms in server.js. 44/44 in-process HTTP tests passed (CRUD, filters, sort, invalid IDs, duplicate roomNumber, invalid type/status, role-guards: guest POST/PUT/DELETE/PATCH→403, guest GET→200, no token any method→401). Mongoose 7+ deprecation fixed: use returnDocument:'after' instead of deprecated new:true. All existing auth/health logic untouched.

## 4. In Progress
(none — frontend complete; backend Step 1, 2, 3 complete; remaining feature models/routes/controllers pending)

## 5. Folder / File Structure
```
project-root/
├── backend/
│   ├── config/
│   │   └── db.js                    Mongoose MongoDB connection helper
│   ├── models/
│   │   ├── User.js                  User schema: name, email (unique), password (bcrypt), role enum, phone, createdAt
│   │   └── Room.js                  Room schema: roomNumber (unique), type enum[4], pricePerNight, status enum[4], description, createdAt
│   ├── routes/
│   │   ├── authRoutes.js            POST /register, POST /login, GET /me (protected)
│   │   └── roomRoutes.js            CRUD /api/rooms + PATCH status; role guards for writes
│   ├── controllers/
│   │   ├── authController.js        register(), login(), getMe()
│   │   └── roomController.js        createRoom, getAllRooms, getRoomById, updateRoom, deleteRoom, updateRoomStatus
│   ├── middleware/
│   │   └── authMiddleware.js        protect() (JWT verify → req.user), authorize(...roles)
│   ├── .env                         PORT, MONGO_URI, JWT_SECRET
│   ├── .gitignore                   node_modules, .env
│   ├── package.json                 7 deps + nodemon dev; scripts: start/dev
│   ├── package-lock.json
│   └── server.js                    Express entry: cors, json, DB connect, /api/health, /api/auth, /api/rooms, listen :5000
├── frontnend/                              (real folder name; typo: missing 'e')
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── assets/
│   │   │   ├── hero.png
│   │   │   ├── react.svg
│   │   │   └── vite.svg
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.jsx              Shared top bar (role switcher, alerts)
│   │   │   │   ├── Layout.jsx              Page wrapper + role-based sidebar
│   │   │   │   └── Navigation.jsx          Sidebar nav items (role-filtered)
│   │   │   └── ui/
│   │   │       ├── Badge.jsx               Status badge component
│   │   │       ├── StatCard.jsx            KPI overview card
│   │   │       ├── ToastContainer.jsx      Toast notifications
│   │   │       └── ProtectedRoute.jsx      Role-based route guard
│   │   ├── context/
│   │   │   ├── AppContext.jsx              Mock data state (fallback until backend)
│   │   │   └── AuthContext.jsx             Auth user + JWT token management
│   │   ├── pages/
│   │   │   ├── Login.jsx                   Login page with role select
│   │   │   ├── Register.jsx                Register page (staff/guest)
│   │   │   ├── AdminDashboard.jsx          KPI cards + analytics
│   │   │   ├── StaffManagement.jsx         Staff CRUD table
│   │   │   ├── SystemSettings.jsx          Tax, pricing, emergency alerts
│   │   │   ├── RoomManagement.jsx          Room CRUD + status
│   │   │   ├── Booking.jsx                 Date search + reservation
│   │   │   ├── CheckInOut.jsx              Today arrivals/departures
│   │   │   ├── Billing.jsx                 Bill breakdown + invoice view
│   │   │   ├── Housekeeping.jsx            Clean status + maintenance
│   │   │   ├── Reports.jsx                 Occupancy + revenue charts
│   │   │   ├── Feedback.jsx                Submit/view feedback
│   │   │   ├── AdditionalServices.jsx      Extras request forms
│   │   │   ├── GuestProfile.jsx            Guest info + booking history
│   │   │   ├── ReceptionistPortal.jsx      (legacy portal alias /reception)
│   │   │   ├── HousekeepingPortal.jsx      (legacy portal alias /housekeeping-portal)
│   │   │   └── GuestPortal.jsx             (legacy portal alias /guest-portal)
│   │   ├── utils/
│   │   │   └── api.js                      Axios instance (base URL + JWT interceptor)
│   │   ├── App.jsx                         Router shell + AuthProvider + all routes
│   │   ├── index.css                       Tailwind v4 entry
│   │   └── main.jsx                        Vite entry
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts                      @tailwindcss/vite plugin wired
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   └── tsconfig.json
├── PROJECT_STATE.md                        This file
└── README.md
```

## 6. API Endpoints (Backend)
Backend scaffold + User Auth + Room Management complete. /api/health, /api/auth/*, and /api/rooms basic CRUD are live. Remaining feature endpoints below are planned — currently return empty or frontend uses mock fallback data.

```
METHOD  /api/...                      - short description                        [STATUS]
GET     /api/health                   - Health check: {status:"ok"}              [STATUS: done]
POST    /api/auth/register            - Register user (staff/guest), return JWT  [STATUS: done]
POST    /api/auth/login               - Authenticate user, return JWT + user     [STATUS: done]
GET     /api/auth/me                  - Get current user profile from token      [STATUS: done]
GET     /api/staff                    - List all staff members                   [STATUS: pending]
POST    /api/staff                    - Create new staff member                  [STATUS: pending]
PUT     /api/staff/:id                - Update staff member                      [STATUS: pending]
PATCH   /api/staff/:id/status         - Toggle staff active/inactive             [STATUS: pending]
GET     /api/rooms                    - List all rooms with status/price         [STATUS: done]
POST    /api/rooms                    - Create new room (admin/manager)          [STATUS: done]
GET     /api/rooms/:id                - Get one room by ID                       [STATUS: done]
PUT     /api/rooms/:id                - Update room details (admin/manager)      [STATUS: done]
DELETE  /api/rooms/:id                - Delete room (admin/manager)              [STATUS: done]
PATCH   /api/rooms/:id/status         - Update room status (admin/manager)       [STATUS: done]
GET     /api/rooms/available          - Search available rooms by date range     [STATUS: pending]
GET     /api/bookings                 - List all reservations                    [STATUS: pending]
POST    /api/bookings                 - Create new reservation                   [STATUS: pending]
GET     /api/bookings/today           - Today's arrivals + departures            [STATUS: pending]
PATCH   /api/bookings/:id/checkin     - Mark booking as checked-in               [STATUS: pending]
PATCH   /api/bookings/:id/checkout    - Mark booking as checked-out              [STATUS: pending]
GET     /api/billing/:bookingId       - Get bill breakdown for a booking         [STATUS: pending]
GET     /api/housekeeping/tasks       - List room cleaning tasks                 [STATUS: pending]
PATCH   /api/housekeeping/:roomId     - Mark room cleaned                        [STATUS: pending]
POST    /api/maintenance              - Report new maintenance issue             [STATUS: pending]
GET     /api/reports/occupancy        - Occupancy rate data (for charts)         [STATUS: pending]
GET     /api/reports/revenue          - Revenue data (for charts)                [STATUS: pending]
GET     /api/feedback                 - List all guest feedback                  [STATUS: pending]
POST    /api/feedback                 - Submit new feedback                      [STATUS: pending]
POST    /api/services                 - Request additional service (room svc...) [STATUS: pending]
GET     /api/guests/:id               - Get guest profile + history              [STATUS: pending]
PUT     /api/guests/:id               - Update guest profile                     [STATUS: pending]
GET     /api/settings                 - Get system settings                      [STATUS: pending]
PUT     /api/settings                 - Update system settings                   [STATUS: pending]
```

## 7. Pages / Components (Frontend)

| Component/Page | Short Description | STATUS |
|---|---|---|
| Login.jsx | Login page with role selection (admin/manager/receptionist/housekeeping/guest) | done |
| Register.jsx | Registration page for new staff and guests | done |
| AdminDashboard.jsx | Overview: KPI cards, revenue/occupancy chart preview, emergency alert banner | done |
| StaffManagement.jsx | Staff table with add/edit/deactivate actions + modal form | done |
| SystemSettings.jsx | Tax rate, price override, cancellation policy, emergency alert toggle | done |
| RoomManagement.jsx | Rooms table (type/status/price) with add/edit room modal | done |
| Booking.jsx | Search available rooms by date range, create reservation, show confirmation | done |
| CheckInOut.jsx | Today's arrivals/departures list with check-in/check-out buttons | done |
| Billing.jsx | Bill breakdown (room + extra services) with "generate invoice" (HTML print) view | done |
| Housekeeping.jsx | Room cleaning list, "mark cleaned" button, maintenance report form | done |
| Reports.jsx | Recharts bar/line/pie charts for occupancy rate & revenue | done |
| Feedback.jsx | Guest submit rating+comment form; admin view all feedback table | done |
| AdditionalServices.jsx | Request room service, wake-up call, or transportation | done |
| GuestProfile.jsx | View/edit guest personal info, contact, preferences, booking history | done |
| Layout.jsx | Shared page wrapper with role-aware sidebar + header + routes outlet | done |
| Navigation.jsx | Sidebar with NavLink items, role-based visibility filters | done |
| Header.jsx | Top bar with menu toggle, global search, role selector, alerts bell | done |
| ProtectedRoute.jsx | Route guard component that checks JWT + user role | done |
| StatCard.jsx | Reusable KPI metric card with icon, value, subtitle, trend | done |
| Badge.jsx | Reusable status badge (color-coded by variant) | done |
| ToastContainer.jsx | Toast notification area driven by AppContext | done |
| AuthContext.jsx | Context provider: user state, JWT token, login/register/logout helpers | done |
| api.js | Axios instance with baseURL=http://localhost:5000/api, JWT interceptor | done |

## 8. Environment Variables
```
# Backend (create .env in backend/ when it exists)
PORT=5000
MONGO_URI=mongodb://localhost:27017/luxurystay
JWT_SECRET=your_jwt_secret_key_here

# Frontend (no env vars needed currently; base URL is hardcoded in src/utils/api.js)
```

## 9. Known Issues / TODO
- Backend APIs (except /api/health, /api/auth/*, /api/rooms basic CRUD & status patch) are NOT YET IMPLEMENTED. All other feature-specific API calls in pages will fail to the mock/fallback state until route modules are built in backend/routes/. (/api/rooms/available date-range search is a separate pending endpoint.)
- "Generate invoice" button in Billing.jsx currently just triggers window.print() on the HTML invoice view; actual PDF generation is deferred.
- Role switching in Header uses a select dropdown for demo; a real system would restrict this based on the authenticated user's actual role (ProtectedRoute does enforce this on direct navigation).
- No persistence: auth state is kept in React context and localStorage; a page refresh restores user from localStorage but the mock data in AppContext resets (backend users are persisted in MongoDB now, but frontend mock data isn't).
- Feedback table in admin view reads from AppContext.mockFeedback only — no real backend storage yet.
- `BellConcierge` icon was aliased to `Sparkles`/`Coffee` because it is not available in the installed lucide-react v1.38.0.
- Legacy portals (ReceptionistPortal.jsx, HousekeepingPortal.jsx, GuestPortal.jsx) are mounted at /reception, /housekeeping-portal, /guest-portal for backward compatibility; primary navigation now uses dedicated per-feature pages.

## 10. Last Updated
2026-09-05 — Backend Step 3 COMPLETED: Room Management. Created models/Room.js (6 fields: roomNumber unique, type enum[single|double|suite|deluxe], pricePerNight min=0, status enum[available|occupied|cleaning|maintenance] default=available, description optional, createdAt), controllers/roomController.js with 6 handlers (createRoom w/ duplicate+validation catches; getAllRooms w/ ?type/?status filters + sort; getRoomById CastError→404; updateRoom; deleteRoom; updateRoomStatus dedicated PATCH w/ missing+invalid status errors), routes/roomRoutes.js (GET read ops=protect only; POST/PUT/DELETE/PATCH=protect+authorize admin/manager). Wired in server.js as app.use('/api/rooms', roomRoutes). 44/44 in-process HTTP tests passed (CRUD, enum validations, duplicate roomNumber, query filters, sort, invalid IDs 404, role guards guest write=403, guest read=200, no token=401). Mongoose 7+ deprecation fixed: returnDocument:'after' instead of deprecated new:true in findByIdAndUpdate calls. Existing auth/health routes untouched. PROJECT_STATE.md updated in §2, §3, §4, §5, §6, §9, §10.
2026-09-05 — Backend Step 2 COMPLETED: User Authentication (Admin/Staff/Guest). Created models/User.js (7 fields: name, email unique, password [bcrypt-hashed via Mongoose 9 compatible async pre('save') hook], role enum[5-role] default=guest, phone, createdAt), controllers/authController.js (register w/ 7-day JWT + validation-error handling + duplicate-email 11000 catch; login w/ matchPassword; getMe), middleware/authMiddleware.js (protect: Bearer <token> → jwt.verify → load user → req.user; authorize(...roles): 403 role guard), routes/authRoutes.js (POST /register, POST /login, GET /me), wired app.use('/api/auth', authRoutes) in server.js. 27/27 in-process HTTP tests passed (register 201, duplicate 400, login 200, wrong-pass 401, /me Bearer 200, /me no-token 401, /me garbage-JWT 401, guest default role + round-trip). Mongoose v9 note applied: async pre-hooks don't receive next() callback → simple return instead of next(). PROJECT_STATE.md updated in §2,3,4,5,6,9,10.
2026-09-04 — Backend Step 1 COMPLETED: backend/ project scaffold initialized, npm deps installed (express, mongoose, dotenv, cors, bcryptjs, jsonwebtoken + nodemon@dev), .env placeholders written, config/db.js mongoose connection helper, server.js Express entry with cors/json middleware + DB connect + listener on :5000, empty folders created (models/, routes/, controllers/, middleware/), GET /api/health → {status:"ok"} tested live (MongoDB localhost connected successfully).
2026-09-04 — Initial frontend build complete: all 13 pages + auth context + API helper + routing. Backend pending.
2026-04-12 — Routing shell (App.jsx) was BROKEN — had only 4 legacy routes, no AuthProvider, no Login/Register. COMPLETELY REWRITTEN with full 13-page route map, AuthProvider wrapping, ProtectedRoute role guards, /login + /register public routes, role-based index redirects, and legacy portal alias routes. Build verified: `npx vite build` passes, dist/ outputs index.html + CSS + JS (919 kB / 251 kB gzipped).
