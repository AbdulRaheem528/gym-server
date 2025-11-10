// utils/db.js
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

function initDb(
  dbFolder = path.join(__dirname, "..", "db"),
  dbFile = "gym.db"
) {
  if (!fs.existsSync(dbFolder)) fs.mkdirSync(dbFolder, { recursive: true });
  const dbPath = path.join(dbFolder, dbFile);
  const db = new Database(dbPath);
  return db;
}

module.exports = { initDb };
