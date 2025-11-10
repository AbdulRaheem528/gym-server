// tools/createAdmin.js (quick one-off script)
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const dbPath = path.join(__dirname, "..", "db", "gym.db");
const db = new Database(dbPath);

const username = "admin";
const password = "admin123"; // change immediately

const hash = bcrypt.hashSync(password, 10);
const stmt = db.prepare(
  "INSERT OR IGNORE INTO users (username, password_hash) VALUES (?, ?)"
);
const info = stmt.run(username, hash);
console.log("Inserted admin, changes:", info.changes);
