// controllers/bloodTypeController.js
function getBloodTypes(req, res) {
  const db = req.app.locals.db;
  const rows = db.prepare("SELECT * FROM blood_types ORDER BY type").all();
  res.json({ ok: true, data: rows });
}

module.exports = { getBloodTypes };
