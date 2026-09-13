import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

// D1's SQL authorizer disallows integrity_check. Verify the same migration
// independently in real SQLite; runtime/trigger behavior is tested in local D1.
const db = new DatabaseSync(":memory:");
try {
  db.exec("PRAGMA foreign_keys=ON; CREATE TABLE existing_data (id TEXT PRIMARY KEY); INSERT INTO existing_data VALUES ('preserved');");
  const sql = readFileSync(new URL("../../../migrations/0035_interpretation_shadow_windows.sql", import.meta.url), "utf8");
  db.exec(`BEGIN; ${sql} COMMIT;`);
  db.exec(sql);
  assert.equal(db.prepare("SELECT id FROM existing_data").get().id, "preserved");
  assert.equal(db.prepare("PRAGMA integrity_check").get().integrity_check, "ok");
  assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type='table' AND name LIKE 'interpretation_shadow_%'").get().count, 3);
  console.log("GCC5D_MIGRATION_0035_INTEGRITY_OK; EXISTING_DATA_PRESERVED; FOREIGN_KEYS_OK");
} finally { db.close(); }
