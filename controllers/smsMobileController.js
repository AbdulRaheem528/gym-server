const { sendGymSMS } = require("../utils/smsMobileApiSender");

async function sendUnpaidReminders(req, res) {
  const db = req.app.locals.db;

  try {
    const members = db
      .prepare(
        "SELECT name, number FROM members WHERE status='active' AND paid=0"
      )
      .all();

    if (!members.length)
      return res.json({ ok: true, message: "No unpaid active members found." });

    const message =
      "Dear member, your gym payment is due. Please submit your fee to continue your membership.";

    let sent = 0;
    for (const m of members) {
      const success = await sendGymSMS(m.number, message);
      if (success) sent++;
    }

    res.json({ ok: true, message: `Reminders sent to ${sent} members.` });
  } catch (err) {
    console.error("[sendUnpaidReminders] Error:", err);
    res.status(500).json({ ok: false, message: "Failed to send reminders" });
  }
}

module.exports = { sendUnpaidReminders };
