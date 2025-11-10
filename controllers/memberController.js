// controllers/memberController.js
const path = require("path");
const fs = require("fs");

function getMembers(req, res) {
  const db = req.app.locals.db;
  const members = db
    .prepare(
      `
    SELECT m.*, bt.type AS blood_type
    FROM members m
    LEFT JOIN blood_types bt ON m.blood_type_id = bt.id
    ORDER BY m.id DESC
  `
    )
    .all();
  res.json({ ok: true, data: members });
}

function getMemberById(req, res) {
  const db = req.app.locals.db;
  const id = req.params.id;
  const row = db
    .prepare(
      `
    SELECT m.*, bt.type AS blood_type
    FROM members m
    LEFT JOIN blood_types bt ON m.blood_type_id = bt.id
    WHERE m.id = ?
  `
    )
    .get(id);
  if (!row)
    return res.status(404).json({ ok: false, message: "Member not found" });
  res.json({ ok: true, data: row });
}

function addMember(req, res) {
  const db = req.app.locals.db;
  const { rollno, name, number, joining_date, paid_until, blood_type_id } =
    req.body;
  const photo = req.file ? req.file.filename : null;

  const stmt = db.prepare(`
    INSERT INTO members (rollno, name, number, joining_date, paid_until, blood_type_id, photo, paid, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'active')
  `);
  const info = stmt.run(
    rollno,
    name,
    number,
    joining_date || null,
    paid_until || null,
    blood_type_id || null,
    photo
  );
  res.json({ ok: true, id: info.lastInsertRowid });
}

function updateMember(req, res) {
  const db = req.app.locals.db;
  const id = req.params.id;

  // In some routes you might be using upload.single() separately — ensure req.file is available
  const photo = req.file ? req.file.filename : null;

  // Since req.body values often come as strings (especially from form-data),
  // we read them directly and treat them as strings.
  const {
    rollno,
    name,
    number,
    joining_date,
    paid_until,
    blood_type_id,
    status,
  } = req.body || {};

  // Get existing row (photo + status)
  const existing = db
    .prepare("SELECT photo, status FROM members WHERE id = ?")
    .get(id);

  if (!existing)
    return res.status(404).json({ ok: false, message: "Member not found" });

  // Run the main update (COALESCE will keep existing values if undefined)
  const stmt = db.prepare(`
    UPDATE members SET
      rollno = COALESCE(?, rollno),
      name = COALESCE(?, name),
      number = COALESCE(?, number),
      joining_date = COALESCE(?, joining_date),
      paid_until = COALESCE(?, paid_until),
      blood_type_id = COALESCE(?, blood_type_id),
      status = COALESCE(?, status),
      photo = COALESCE(?, photo)
    WHERE id = ?
  `);

  // Note: ensure parameter order matches the COALESCE order above.
  const info = stmt.run(
    rollno !== undefined ? rollno : null,
    name !== undefined ? name : null,
    number !== undefined ? number : null,
    joining_date !== undefined ? joining_date : null,
    paid_until !== undefined ? paid_until : null,
    blood_type_id !== undefined ? blood_type_id : null,
    status !== undefined ? status : null,
    photo ? photo : existing.photo,
    id
  );

  // If update did not change anything and row exists, we'll still continue
  // Now enforce the business rule:
  // If the member's current status (after update) is 'inactive' => set paid = 0 and clear paid_until
  const updated = db.prepare("SELECT status FROM members WHERE id = ?").get(id);

  // ensure we compare strings case-insensitively just in case
  if (updated && typeof updated.status === "string") {
    const curStatus = updated.status.toLowerCase();
    if (curStatus === "inactive") {
      // Force unpaid and remove paid_until
      db.prepare(
        "UPDATE members SET paid = 0, paid_until = NULL WHERE id = ?"
      ).run(id);
    }
  }

  // delete old photo if replaced
  if (photo && existing.photo) {
    try {
      fs.unlinkSync(path.join(__dirname, "..", "uploads", existing.photo));
    } catch (e) {
      /* ignore */
    }
  }

  res.json({ ok: true, changes: info.changes });
}

function deleteMember(req, res) {
  const db = req.app.locals.db;
  const id = req.params.id;
  const existing = db.prepare("SELECT photo FROM members WHERE id = ?").get(id);
  if (!existing)
    return res.status(404).json({ ok: false, message: "Member not found" });

  db.prepare("DELETE FROM members WHERE id = ?").run(id);
  if (existing.photo) {
    try {
      fs.unlinkSync(path.join(__dirname, "..", "uploads", existing.photo));
    } catch (e) {
      /* ignore */
    }
  }
  res.json({ ok: true });
}

function setPaid(req, res) {
  const db = req.app.locals.db;
  const id = req.params.id;
  const { paid, paid_until } = req.body;

  if (typeof paid === "undefined") {
    return res.status(400).json({ ok: false, message: "paid is required" });
  }

  const member = db.prepare("SELECT * FROM members WHERE id = ?").get(id);
  if (!member)
    return res.status(404).json({ ok: false, message: "Member not found" });

  // If marking as paid (1)
  if (Number(paid) === 1) {
    let newPaidUntil;

    if (paid_until) {
      // 🧠 Use manual date from owner
      // Make sure it’s saved as YYYY-MM-DD
      const manual = new Date(paid_until);
      newPaidUntil = manual.toISOString().split("T")[0];
    } else {
      // 🧠 Default: +1 month from today (store as ISO date)
      const newDate = new Date();
      newDate.setMonth(newDate.getMonth() + 1);
      newPaidUntil = newDate.toISOString().split("T")[0];
    }

    db.prepare("UPDATE members SET paid = 1, paid_until = ? WHERE id = ?").run(
      newPaidUntil,
      id
    );

    return res.json({
      ok: true,
      message: "Payment updated",
      paid_until: newPaidUntil,
    });
  }

  // If marking as unpaid (0)
  db.prepare("UPDATE members SET paid = 0, paid_until = NULL WHERE id = ?").run(
    id
  );
  return res.json({ ok: true, message: "Marked as unpaid" });
}

module.exports = {
  getMembers,
  getMemberById,
  addMember,
  updateMember,
  deleteMember,
  setPaid,
};
