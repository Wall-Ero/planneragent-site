import { closeSync, fsyncSync, openSync, writeFileSync } from "node:fs";

// Shared 13H exclusive, synced write. Never overwrite, reset or remove a marker.
export function writeExclusiveSyncedV1(path: string, value: unknown): void {
  const fd = openSync(path, "wx", 0o600);
  try { writeFileSync(fd, JSON.stringify(value, null, 2) + "\n", "utf8"); fsyncSync(fd); }
  finally { closeSync(fd); }
}
