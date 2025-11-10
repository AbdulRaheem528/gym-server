// server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");

const { initDb } = require("./utils/db");
const { schedulePaidStatusJob } = require("./utils/paidCron");
const authRoutes = require("./routes/auth");
const memberRoutes = require("./routes/members");
const bloodRoutes = require("./routes/bloodtypes");
const { errorHandler } = require("./middlewares/errorHandler");

const app = express();
const PORT = process.env.PORT || 10000;

// basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// serve uploaded images statically
const uploadsFolder = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsFolder))
  fs.mkdirSync(uploadsFolder, { recursive: true });
app.use("/uploads", express.static(uploadsFolder));

// init db and run migration
const db = initDb();
const migrationPath = path.join(__dirname, "migrations", "001_init_tables.sql");
if (fs.existsSync(migrationPath)) {
  const sql = fs.readFileSync(migrationPath, "utf8");
  db.exec(sql);
  console.log("✅ migrations executed");
} else {
  console.warn("⚠️ migrations file not found:", migrationPath);
}

// make db available in req.app.locals
app.locals.db = db;

// schedule cron job
schedulePaidStatusJob(db);

// routes
app.use("/api/auth", authRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/blood-types", bloodRoutes);

// error handler
app.use(errorHandler);

// simple health route
app.get("/api/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`🚀 Gym API running on port ${PORT}`);
});

// Testing

const { runPaidStatusUpdateNow } = require("./utils/paidCron");

// ...

// 🧪 Manual test trigger
const changed = runPaidStatusUpdateNow(db);
console.log(`[manual-test] Paid status updated for ${changed} members`);
