BEGIN TRANSACTION;

-- users table (admin/login)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

-- blood types
CREATE TABLE IF NOT EXISTS blood_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT UNIQUE NOT NULL
);

-- members table (final schema per your spec)
CREATE TABLE IF NOT EXISTS members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rollno TEXT UNIQUE,
  name TEXT NOT NULL,
  number TEXT,
  paid INTEGER DEFAULT 0,           -- 1 = paid, 0 = not paid
  status TEXT DEFAULT 'active',     -- 'active' or 'inactive'
  photo TEXT,
  joining_date INTEGER,             -- unix ms
  paid_until INTEGER,               -- unix ms
  blood_type_id INTEGER,
  FOREIGN KEY (blood_type_id) REFERENCES blood_types(id)
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_members_rollno ON members(rollno);
CREATE INDEX IF NOT EXISTS idx_members_number ON members(number);
CREATE INDEX IF NOT EXISTS idx_members_paid_until ON members(paid_until);

-- populate standard blood types
INSERT OR IGNORE INTO blood_types (type)
VALUES ('A+'),('A-'),('B+'),('B-'),('AB+'),('AB-'),('O+'),('O-');

COMMIT;
