// controllers/authController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

function login(req, res) {
  const db = req.app.locals.db;
  const { username, password } = req.body;
  if (!username || !password)
    return res
      .status(400)
      .json({ ok: false, message: "username and password required" });

  const user = db
    .prepare("SELECT * FROM users WHERE username = ?")
    .get(username);
  if (!user)
    return res.status(401).json({ ok: false, message: "Invalid credentials" });

  const match = bcrypt.compareSync(password, user.password_hash);
  if (!match)
    return res.status(401).json({ ok: false, message: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET || "dev_secret",
    { expiresIn: "8h" }
  );
  res.json({ ok: true, token, user: { id: user.id, username: user.username } });
}

module.exports = { login };
