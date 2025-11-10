// routes/members.js
const express = require("express");
const router = express.Router();
const memberController = require("../controllers/memberController");
const { verifyToken } = require("../middlewares/authMiddleware");
const { upload } = require("../utils/upload");
const { initDb } = require("../utils/db");
const db = initDb();
const { sendUnpaidReminders } = require("../controllers/smsMobileController");
router.post("/send-unpaid-reminders", verifyToken, sendUnpaidReminders);

// protected endpoints
router.get("/", verifyToken, memberController.getMembers);
router.get("/:id", verifyToken, memberController.getMemberById);

// Create member with optional photo (field name: photo)
router.post(
  "/",
  verifyToken,
  upload.single("photo"),
  memberController.addMember
);

// ✅ Update member (works for JSON or multipart/form-data)
router.put("/:id", verifyToken, async (req, res) => {
  const id = req.params.id;

  try {
    let body = req.body;
    let file = null;

    // Handle multipart form-data
    if (req.is("multipart/form-data")) {
      await new Promise((resolve, reject) => {
        upload.single("photo")(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      body = req.body;
      file = req.file;
    }

    const { name, number, blood_type_id, joining_date, status } = body;
    const photo = file ? file.filename : undefined;

    const fields = [];
    const values = [];

    if (name) {
      fields.push("name = ?");
      values.push(name);
    }
    if (number) {
      fields.push("number = ?");
      values.push(number);
    }
    if (blood_type_id) {
      fields.push("blood_type_id = ?");
      values.push(blood_type_id);
    }
    if (joining_date) {
      fields.push("joining_date = ?");
      values.push(joining_date);
    }
    if (status) {
      fields.push("status = ?");
      values.push(status);
    }
    if (photo) {
      fields.push("photo = ?");
      values.push(photo);
    }

    if (fields.length === 0) {
      return res.status(400).json({ ok: false, message: "No fields provided" });
    }

    const sql = `UPDATE members SET ${fields.join(", ")} WHERE id = ?`;
    values.push(id);

    // ✅ Use better-sqlite3’s synchronous .prepare().run()
    const stmt = db.prepare(sql);
    const result = stmt.run(...values);

    if (result.changes === 0) {
      return res.status(404).json({ ok: false, message: "Member not found" });
    }

    res.json({ ok: true, changes: result.changes });
  } catch (err) {
    console.error("PUT /api/members/:id error:", err);
    res.status(500).json({ ok: false, message: "Internal Server Error" });
  }
});

// Delete
router.delete("/:id", verifyToken, memberController.deleteMember);

// Manual set paid endpoint
router.post("/:id/set-paid", verifyToken, memberController.setPaid);

module.exports = router;
