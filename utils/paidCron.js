// utils/paidCron.js
const cron = require("node-cron");

function schedulePaidStatusJob(db, options = {}) {
  // Run daily at 00:05 by default (for testing you can change to "* * * * *")
  const schedule = options.time || "5 0 * * *";
  const timezone =
    options.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  const task = cron.schedule(
    schedule,
    () => {
      try {
        const today = new Date();
        const todayISO = today.toISOString().split("T")[0]; // "YYYY-MM-DD"

        // ✅ Compare using date() for ISO strings
        const update = db.prepare(`
          UPDATE members
          SET paid = 0
          WHERE paid_until IS NOT NULL
            AND date(paid_until) < date(?)
            AND paid != 0
        `);

        const info = update.run(todayISO);
        console.log(
          `[cron] Paid status job ran (${todayISO}). Rows updated: ${info.changes}`
        );
      } catch (err) {
        console.error("[cron] Paid status job error:", err);
      }
    },
    {
      scheduled: true,
      timezone,
    }
  );

  task.start();
  return task;
}

function runPaidStatusUpdateNow(db) {
  const today = new Date();
  const todayISO = today.toISOString().split("T")[0];

  const update = db.prepare(`
    UPDATE members
    SET paid = 0
    WHERE paid_until IS NOT NULL
      AND date(paid_until) < date(?)
      AND paid != 0
  `);

  const info = update.run(todayISO);
  console.log(
    `[manual-run] Paid status update now (${todayISO}). Updated: ${info.changes}`
  );
  return info.changes;
}

module.exports = { schedulePaidStatusJob, runPaidStatusUpdateNow };
