// backend/server.js
// Entry point for the LuxuryStay Hospitality backend.
// This file:
//   1) Loads environment variables from .env
//   2) Connects to MongoDB using our helper in config/db.js
//   3) Boots an Express app with JSON parsing + CORS
//   4) Mounts the /api/health test endpoint + modular route modules
//   5) Listens on the configured PORT

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// --- Route modules ---------------------------------------------------------
// Each module lives in backend/routes/*.js and handles a specific domain
// (auth, rooms, bookings, etc.). Mount them here under /api/...
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');

// 1) Connect to the database BEFORE we start listening, so the
//    server never accepts requests while the DB is unreachable.
connectDB();

// 2) Set up the Express application.
const app = express();

// 3) Middleware — every request passes through these:
//    - express.json()  => parses JSON bodies (POST/PUT/PATCH payloads)
//    - cors()          => allows cross-origin requests from the React frontend
//                         running on a different port (Vite defaults to :5173)
app.use(express.json());
app.use(cors());

// 4a) Simple test endpoint. Open http://localhost:5000/api/health
//     in your browser (or use curl / Postman) to confirm the server
//     is up and reachable.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 4b) Domain-specific route modules:
//     /api/auth/*  →  register, login, get-me (handled in routes/authRoutes.js)
app.use('/api/auth', authRoutes);
//     /api/rooms/* →  room CRUD + status patch (handled in routes/roomRoutes.js)
app.use('/api/rooms', roomRoutes);

// 5) Start the HTTP listener.
//    If PORT isn't set in .env we fall back to 5000.
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 LuxuryStay backend running on port ${PORT}`);
  console.log(`   Health check : http://localhost:${PORT}/api/health`);
  console.log(`   Auth routes  : POST /api/auth/register, POST /api/auth/login, GET /api/auth/me`);
  console.log(`   Room routes  : CRUD /api/rooms, PATCH /api/rooms/:id/status`);
});
