// config/db.js
// MongoDB connection helper using Mongoose.
// We keep the connect logic in a separate file so server.js stays clean
// and we can re-use the connection in other places if needed later.

const mongoose = require('mongoose');

/**
 * connectDB()
 *
 * Reads MONGO_URI from the .env file (loaded in server.js via dotenv)
 * and attempts to open a long-lived Mongoose connection to MongoDB.
 * - On success: logs the connected DB host name.
 * - On failure: logs the error and EXITS the process with code 1.
 *   (If we can't reach the DB, the backend is unusable, so crashing
 *   with a clear message is cleaner than running in a broken state.)
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
