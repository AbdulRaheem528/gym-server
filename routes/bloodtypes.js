// routes/bloodtypes.js
const express = require("express");
const router = express.Router();
const { getBloodTypes } = require("../controllers/bloodTypeController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.get("/", verifyToken, getBloodTypes);

module.exports = router;
