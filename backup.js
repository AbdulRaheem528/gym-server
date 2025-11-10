// backup.js
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// Format date for backup name
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

// Paths
const projectRoot = path.resolve("./");
const dbPath = path.join(projectRoot, "db", "gym.db");
const uploadsPath = path.join(projectRoot, "uploads");
const backupDir = path.join(projectRoot, "backups");
const zipFile = path.join(backupDir, `backup_${timestamp}.zip`);

// Ensure backups folder exists
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// Run backup
try {
  console.log("🗂️  Starting backup...");

  // Copy database
  const tempDir = path.join(backupDir, `temp_${timestamp}`);
  fs.mkdirSync(tempDir);
  fs.copyFileSync(dbPath, path.join(tempDir, "gym.db"));

  // Copy uploads folder
  execSync(
    `xcopy "${uploadsPath}" "${path.join(tempDir, "uploads")}" /E /I /H`
  );

  // Zip it
  execSync(
    `powershell Compress-Archive -Path "${tempDir}\\*" -DestinationPath "${zipFile}"`
  );

  // Cleanup temp folder
  fs.rmSync(tempDir, { recursive: true, force: true });

  console.log(`✅ Backup complete: ${zipFile}`);
} catch (err) {
  console.error("❌ Backup failed:", err.message);
}
