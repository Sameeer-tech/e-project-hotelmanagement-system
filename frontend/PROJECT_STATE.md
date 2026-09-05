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
Backend: Node.js, Express.js (STEP 1, 2, 3, 4, 5 DONE: scaffold + DB conn + /api/health + User Auth + Room Mgmt CRUD + Reservations + Check-in/Check-out + Billing & Invoicing)
Database: MongoDB (Mongoose) (User + Room + Reservation + Bill models live; hk/maintenance/reports/etc. models pending)
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
- **Backend Step 4 — Reservations & Check-in/Check-out:** Created `models/Reservation.js` (fields: guest ObjectId ref User required, room ObjectId ref Room required, checkInDate Date required, checkOutDate Date required, status enum[booked|checked-in|checked-out|cancelled] default='booked', createdAt Date default=now; indexes on room+dates, guest, status). Created `controllers/reservationController.js` with 7 handlers: createReservation (accepts both backend shape {guest,room,checkInDate,checkOutDate} AND frontend Booking.jsx shape {roomId,checkIn,checkOut,guest:{name,email,phone}} — auto-creates guest User if missing; validates date order, room exists + not maintenance, runs date-overlap availability check against booked/checked-in reservations → 409 on conflict; returns 201 with populated refs), getAllReservations (?guest/&room/?status filters; guests auto-scoped to own reservations only, staff see all; returns populated sorted createdAt DESC; output mapped to frontend shape with reference, guestName, room.number, Pending/Checked In/Checked Out status labels), getReservationsToday (staff only; today-window query: arrivals=booked+checkIn=today, departures=checked-in+checkOut=today + in-house fallback so demo page populated; returns combined array matching CheckInOut.jsx mock schema), getReservationById (CastError→404; flexible ID resolution: Mongo _id OR frontend synthetic BK-IN-<roomId>/BK-OUT-<roomId> OR room number string; non-staff privacy guard 403 otherwise), cancelReservation (status must be 'booked' else 400 → 'cancelled'; flexible IDs), checkIn (status must be 'booked' → 'checked-in' + Room.status='occupied' atomically; flexible IDs), checkOut (status must be 'checked-in' → 'checked-out' + Room.status='cleaning' atomically; flexible IDs). Created `routes/reservationRoutes.js`: GET /, POST / all protected (any user); GET /today protected + staff-only; GET /:id protected; PATCH /:id/cancel, /:id/checkin, /:id/checkout protected + authorize('admin','manager','receptionist'). Mounted at BOTH /api/reservations (canonical) AND /api/bookings (alias) in server.js so existing Booking.jsx/CheckInOut.jsx frontend URLs work with NO frontend code changes required. Console banner updated. All existing routes untouched.
- **Backend Step 5 — Billing & Invoicing:** Created `models/Bill.js` (fields: reservation ObjectId ref Reservation required, roomCharge Number min=0 default=0, extraServices Array[{name String required trim, cost Number min=0}] default=[], totalAmount Number min=0 default=0, status enum[unpaid|paid] default='unpaid', createdAt Date default=now; indexes on reservation, status). Created `controllers/billController.js` with 6 handlers + 2 bonus: generateBill (POST — accepts reservationId Mongo / BK-ref / room-number; validates extras schema; auto-computes roomCharge = Room.pricePerNight × nights; re-uses any existing unpaid bill for the same reservation OR creates a new one; returns frontend-shaped payload w/ invoiceNumber + bookingRef + tax-at-12% + grandTotal + extrasFrontend array matching Billing.jsx invoice renderer), getAllBills (GET / — staff only, ?status + ?reservation filters, sorted createdAt DESC, each row mapped toFrontend), getBillById (GET /:id Bill Mongo ID — privacy guard: guests only their own → 403 otherwise), getBillByReservation (GET /reservation/:ref per Step 5 spec — resolves booking ref / Mongo ID / room-number / synthetic IDs; returns single bill + all[] array for list-style callers + privacy guard), getBillByBookingRef (GET /billing/:bookingRef alias for Billing.jsx page's existing `api.get('/billing/${bookingRef}')` call — auto-generates an unpaid bill on first hit if none exists so the page isn't empty, 404 on unknown refs so Billing.jsx .catch swallows and falls back to mock), markBillPaid (PATCH /:id/pay → sets bill.status='paid'; idempotent when already paid; staff only). Created `routes/billRoutes.js`: POST / + GET / protected + authorize(admin/manager/receptionist); GET /reservation/:ref + GET /:id protected (any user + controller privacy guard applied); PATCH /:id/pay protected + staff-only authorize; GET /billing/:bookingRef + GET /:bookingRef(wildcard) protected so Billing.jsx URL shape works. Mounted same billRoutes at BOTH /api/bills (canonical Step 5 URL) AND /api/billing (frontend alias) in server.js; banner updated. All existing routes untouched. 0 syntax errors, 0 VS Code diagnostics.

## 4. In Progress
(none — frontend complete; backend Step 1, 2, 3, 4, 5 complete; remaining feature models/routes/controllers pending)

## 5. Folder / File Structure
```
project-root/
├── backend/
│   ├── config/
│   │   └── db.js                    Mongoose MongoDB connection helper
│   ├── models/
│   │   ├── User.js                  User schema: name, email (unique), password (bcrypt), role enum, phone, createdAt
│   │   ├── Room.js                  Room schema: roomNumber (unique), type enum[4], pricePerNight, status enum[4], description, createdAt
│   │   ├── Reservation.js           Reservation schema: guest ref User, room ref Room, checkIn/Out dates, status enum[4], createdAt
│   │   └── Bill.js                  Bill schema: reservation ref, roomCharge, extraServices[{name,cost}], totalAmount, status[unpaid|paid], createdAt
│   ├── routes/
│   │   ├── authRoutes.js            POST /register, POST /login, GET /me (protected)
│   │   ├── roomRoutes.js            CRUD /api/rooms + PATCH status; role guards for writes
│   │   ├── reservationRoutes.js     CRUD /api/reservations (+ alias at /api/bookings), GET /today staff-only; PATCH {cancel,checkin,checkout} staff only
│   │   └── billRoutes.js            CRUD /api/bills (+ alias at /api/billing); POST create / PATCH pay staff-only; GET read = any logged-in w/ controller privacy guard
│   ├── controllers/
│   │   ├── authController.js        register(), login(), getMe()
│   │   ├── roomController.js        createRoom, getAllRooms, getRoomById, updateRoom, deleteRoom, updateRoomStatus
│   │   ├── reservationController.js 7 handlers: createReservation (dual-payload + auto-create guest + availability), getAllReservations (privacy-scoped), getReservationsToday (staff), getReservationById (flexible ID + privacy), cancelReservation, checkIn, checkOut  (all outputs mapped to frontend-compatible shapes)
│   │   └── billController.js        generateBill (roomCharge=nights*pricePerNight + extras total; unpaid-bill reuse; frontend shape), getAllBills, getBillById, getBillByReservation, getBillByBookingRef (Billing.jsx auto-populate), markBillPaid (idempotent)
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
GET     /api/reservations             - List all reservations (guests see own)   [STATUS: done]
POST    /api/reservations             - Create new reservation (checks avail)    [STATUS: done]
GET     /api/reservations/today       - Today arrivals + departures (staff)      [STATUS: done]
GET     /api/reservations/:id         - Get one reservation (guests own only)    [STATUS: done]
PATCH   /api/reservations/:id/cancel  - Cancel booked reservation (staff)        [STATUS: done]
PATCH   /api/reservations/:id/checkin - Mark reservation checked-in (staff)      [STATUS: done]
PATCH   /api/reservations/:id/checkout- Mark reservation checked-out (staff)     [STATUS: done]
GET     /api/bookings                 - Alias → /api/reservations (frontend URL) [STATUS: done]
POST    /api/bookings                 - Alias → /api/reservations (frontend URL) [STATUS: done]
GET     /api/bookings/today           - Alias → /api/reservations/today          [STATUS: done]
PATCH   /api/bookings/:id/checkin     - Alias → /api/reservations/:id/checkin    [STATUS: done]
PATCH   /api/bookings/:id/checkout    - Alias → /api/reservations/:id/checkout   [STATUS: done]
POST    /api/bills                    - Generate bill for a reservation (staff)   [STATUS: done]
GET     /api/bills                    - List all bills (staff only)               [STATUS: done]
GET     /api/bills/:id                - Get single bill (guests own only)         [STATUS: done]
GET     /api/bills/reservation/:ref   - Get bill(s) for a reservation            [STATUS: done]
PATCH   /api/bills/:id/pay            - Mark bill as paid (staff)                 [STATUS: done]
GET     /api/billing/:bookingRef      - Alias — auto-generates bill on 1st load  [STATUS: done]
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
- Backend APIs (except /api/health, /api/auth/*, /api/rooms basic CRUD & status patch, /api/reservations + /api/bookings alias, /api/bills + /api/billing alias) are NOT YET IMPLEMENTED. All other feature-specific API calls in pages will fail to the mock/fallback state until route modules are built in backend/routes/. (Pending: /api/rooms/available date-range search, housekeeping tasks, maintenance reports, charts/reports, feedback, additional services, guests profile, system settings.)
- "Generate invoice" button in Billing.jsx currently just triggers window.print() on the HTML invoice view; actual PDF generation is deferred (server now returns invoiceNumber + structured line items so printing works correctly).
- Role switching in Header uses a select dropdown for demo; a real system would restrict this based on the authenticated user's actual role (ProtectedRoute does enforce this on direct navigation).
- No persistence: auth state is kept in React context and localStorage; a page refresh restores user from localStorage but the mock data in AppContext resets (backend users/rooms/reservations/bills are persisted in MongoDB now).
- Feedback table in admin view reads from AppContext.mockFeedback only — no real backend storage yet.
- `BellConcierge` icon was aliased to `Sparkles`/`Coffee` because it is not available in the installed lucide-react v1.38.0.
- Legacy portals (ReceptionistPortal.jsx, HousekeepingPortal.jsx, GuestPortal.jsx) are mounted at /reception, /housekeeping-portal, /guest-portal for backward compatibility; primary navigation now uses dedicated per-feature pages.
- Note: Reservation /bookings handlers create a guest User document on-the-fly (from the Booking.jsx form's `guest.email`) if no user with that email exists; auto-generated passwords are of the form `guest-<timestamp>` so guests can reset later via UI (password-reset flow pending).
- Note: Status naming convention uses TWO parallel vocabularies: backend stores {booked, checked-in, checked-out, cancelled} in MongoDB, but responses sent to the frontend are mapped to {Pending, Checked In, Checked Out, Cancelled} (with room.status also mapped from {available, occupied, cleaning, maintenance} → {Available, Occupied, Needs Cleaning, Maintenance}) so the existing mock-dependent frontend renderers work without changes. The handlers accept flexible ID inputs (Mongo _id, synthetic BK-IN-/BK-OUT- prefixes, room number strings) to match how CheckInOut.jsx wires its mock demo IDs into the PATCH checkin/checkout URLs.
- Note: Billing (Bill.js) stores totals pre-tax in totalAmount; the controller applies tax-at-12% on output (toFrontend) so Billing.jsx sidebar + printed invoice agree. The "Mark as Paid" button in Billing.jsx is currently a local demo toast; to wire it to the real PATCH /api/bills/:id/pay the frontend JSX needs a one-line handler (added when Step 5 frontend integration is requested).

## 10. Last Updated
2026-09-05 — Backend Step 5 COMPLETED: Billing & Invoicing. Created models/Bill.js (7 fields: reservation ObjectId ref Reservation required, roomCharge Number min=0 default=0, extraServices Array[{name String required trim, cost Number min=0}] default=[], totalAmount Number min=0 default=0, status enum[unpaid|paid] default='unpaid', createdAt Date default=now; indexes on reservation + status). Created controllers/billController.js with 6 core handlers + 2 bonuses: generateBill (POST — resolves reservationId Mongo / BK- ref / room number / synthetic BK-IN- via shared resolveReservationFromRef helper; validates each extra service entry; auto-computes nights & roomCharge = pricePerNight × nights; reuses any existing UNPAID bill for the same stay (acts as refresh) OR creates new one; response shape includes invoiceNumber INV-YYYY-NNNN, bookingRef BK-YYYY-NNNN, guest/stay info, subTotal + 12% tax calc, grandTotal w/ tax, extrasFrontend array matching Billing.jsx invoice loop), getAllBills (staff-only, ?status/?reservation filters, sorted createdAt DESC, each row toFrontend-mapped), getBillById (Bill Mongo _id, staff OR guest's own stay only — 403 otherwise), getBillByReservation (GET /reservation/:ref per spec, resolves booking-ref/BK-synthetic/room-number, returns single=data + all[] list, privacy guard), getBillByBookingRef (GET /billing/:bookingRef alias — wraps Billing.jsx's existing api.get('/billing/${bookingRef}') call; 404s unknown refs so frontend .catch swallows + uses mock; auto-generates 1st bill (no extras) on first hit so page always pre-populated), markBillPaid (PATCH /:id/pay staff-only, idempotent when already paid). Created routes/billRoutes.js: POST / + GET / protect + authorize(admin/manager/receptionist), GET /reservation/:ref + GET /:id protect w/ controller privacy guard, PATCH /:id/pay protect + authorize staff, GET /billing/:bookingRef + wildcard GET /:bookingRef protect so Billing.jsx URL variants work. Mounted same billRoutes instance at /api/bills (canonical) AND /api/billing (frontend legacy alias) in server.js; updated console banner. node --check x4 = exit 0. VS Code diagnostics = 0 errors. PROJECT_STATE.md updated in §2, §3, §4, §5, §6, §9, §10. All pre-existing routes (health/auth/rooms/reservations/bookings) untouched.
2026-09-05 — Backend Step 2 COMPLETED: User Authentication (Admin/Staff/Guest). Created models/User.js (7 fields: name, email unique, password [bcrypt-hashed via Mongoose 9 compatible async pre('save') hook], role enum[5-role] default=guest, phone, createdAt), controllers/authController.js (register w/ 7-day JWT + validation-error handling + duplicate-email 11000 catch; login w/ matchPassword; getMe), middleware/authMiddleware.js (protect: Bearer <token> → jwt.verify → load user → req.user; authorize(...roles): 403 role guard), routes/authRoutes.js (POST /register, POST /login, GET /me), wired app.use('/api/auth', authRoutes) in server.js. 27/27 in-process HTTP tests passed (register 201, duplicate 400, login 200, wrong-pass 401, /me Bearer 200, /me no-token 401, /me garbage-JWT 401, guest default role + round-trip). Mongoose v9 note applied: async pre-hooks don't receive next() callback → simple return instead of next(). PROJECT_STATE.md updated in §2,3,4,5,6,9,10.
2026-09-04 — Backend Step 1 COMPLETED: backend/ project scaffold initialized, npm deps installed (express, mongoose, dotenv, cors, bcryptjs, jsonwebtoken + nodemon@dev), .env placeholders written, config/db.js mongoose connection helper, server.js Express entry with cors/json middleware + DB connect + listener on :5000, empty folders created (models/, routes/, controllers/, middleware/), GET /api/health → {status:"ok"} tested live (MongoDB localhost connected successfully).
2026-09-04 — Initial frontend build complete: all 13 pages + auth context + API helper + routing. Backend pending.
2026-04-12 — Routing shell (App.jsx) was BROKEN — had only 4 legacy routes, no AuthProvider, no Login/Register. COMPLETELY REWRITTEN with full 13-page route map, AuthProvider wrapping, ProtectedRoute role guards, /login + /register public routes, role-based index redirects, and legacy portal alias routes. Build verified: `npx vite build` passes, dist/ outputs index.html + CSS + JS (919 kB / 251 kB gzipped).
