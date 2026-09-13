CREATE TABLE IF NOT EXISTS interpretation_shadow_windows (
  window_id TEXT PRIMARY KEY, state TEXT NOT NULL CHECK(state IN ('OPEN','CLOSED')),
  candidate_id TEXT NOT NULL, candidate_version TEXT NOT NULL, lifecycle TEXT NOT NULL CHECK(lifecycle='QUALIFIED_FOR_SHADOW'),
  artifact_sha256 TEXT NOT NULL, adapter_digest TEXT NOT NULL, policy_version INTEGER NOT NULL CHECK(policy_version=1),
  serving_json TEXT NOT NULL CHECK(json_valid(serving_json)), revision INTEGER NOT NULL DEFAULT 0,
  sample_percent REAL NOT NULL CHECK(sample_percent >= 0 AND sample_percent <= 100), started_at TEXT NOT NULL,
  ended_at TEXT, total_eligible INTEGER NOT NULL DEFAULT 0, sampled INTEGER NOT NULL DEFAULT 0,
  frozen_result_json TEXT, CHECK((state='OPEN' AND ended_at IS NULL AND frozen_result_json IS NULL) OR (state='CLOSED' AND ended_at IS NOT NULL AND frozen_result_json IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS interpretation_shadow_observations (
  observation_id TEXT PRIMARY KEY, window_id TEXT NOT NULL REFERENCES interpretation_shadow_windows(window_id),
  candidate_id TEXT NOT NULL, artifact_sha256 TEXT NOT NULL, policy_version INTEGER NOT NULL, observed_at TEXT NOT NULL,
  observation_json TEXT NOT NULL, UNIQUE(window_id, observation_id)
);
CREATE TRIGGER IF NOT EXISTS interpretation_shadow_closed_window_immutable BEFORE UPDATE ON interpretation_shadow_windows
WHEN OLD.state='CLOSED' BEGIN SELECT RAISE(ABORT,'CLOSED_SHADOW_WINDOW_IMMUTABLE'); END;
CREATE TRIGGER IF NOT EXISTS interpretation_shadow_window_no_delete BEFORE DELETE ON interpretation_shadow_windows BEGIN SELECT RAISE(ABORT,'SHADOW_WINDOW_DELETE_FORBIDDEN'); END;
CREATE TRIGGER IF NOT EXISTS interpretation_shadow_observation_immutable_update BEFORE UPDATE ON interpretation_shadow_observations BEGIN SELECT RAISE(ABORT,'SHADOW_OBSERVATION_IMMUTABLE'); END;
CREATE TRIGGER IF NOT EXISTS interpretation_shadow_observation_immutable_delete BEFORE DELETE ON interpretation_shadow_observations BEGIN SELECT RAISE(ABORT,'SHADOW_OBSERVATION_DELETE_FORBIDDEN'); END;
CREATE TRIGGER IF NOT EXISTS interpretation_shadow_observation_open_window BEFORE INSERT ON interpretation_shadow_observations
WHEN NOT EXISTS(SELECT 1 FROM interpretation_shadow_windows WHERE window_id=NEW.window_id AND state='OPEN' AND candidate_id=NEW.candidate_id AND artifact_sha256=NEW.artifact_sha256 AND policy_version=NEW.policy_version)
BEGIN SELECT RAISE(ABORT,'SHADOW_WINDOW_NOT_OPEN_OR_PIN_MISMATCH'); END;
CREATE TABLE IF NOT EXISTS interpretation_shadow_admissions (
  observation_id TEXT PRIMARY KEY, window_id TEXT NOT NULL REFERENCES interpretation_shadow_windows(window_id),
  sampled INTEGER NOT NULL CHECK(sampled IN (0,1))
);
CREATE INDEX IF NOT EXISTS interpretation_shadow_observations_window ON interpretation_shadow_observations(window_id,observation_id);
CREATE TRIGGER IF NOT EXISTS interpretation_shadow_pins_immutable BEFORE UPDATE ON interpretation_shadow_windows
WHEN NEW.window_id IS NOT OLD.window_id OR NEW.candidate_id IS NOT OLD.candidate_id OR NEW.candidate_version IS NOT OLD.candidate_version
 OR NEW.lifecycle IS NOT OLD.lifecycle OR NEW.artifact_sha256 IS NOT OLD.artifact_sha256 OR NEW.adapter_digest IS NOT OLD.adapter_digest
 OR NEW.policy_version IS NOT OLD.policy_version OR NEW.sample_percent IS NOT OLD.sample_percent OR NEW.started_at IS NOT OLD.started_at OR NEW.serving_json IS NOT OLD.serving_json
BEGIN SELECT RAISE(ABORT,'SHADOW_WINDOW_PINS_IMMUTABLE'); END;
CREATE TRIGGER IF NOT EXISTS interpretation_shadow_admission_open BEFORE INSERT ON interpretation_shadow_admissions
WHEN NOT EXISTS(SELECT 1 FROM interpretation_shadow_windows WHERE window_id=NEW.window_id AND state='OPEN')
BEGIN SELECT RAISE(ABORT,'SHADOW_WINDOW_NOT_OPEN'); END;
CREATE TRIGGER IF NOT EXISTS interpretation_shadow_admission_count AFTER INSERT ON interpretation_shadow_admissions
BEGIN UPDATE interpretation_shadow_windows SET total_eligible=total_eligible+1,sampled=sampled+NEW.sampled,revision=revision+1 WHERE window_id=NEW.window_id; END;
CREATE TRIGGER IF NOT EXISTS interpretation_shadow_admission_no_update BEFORE UPDATE ON interpretation_shadow_admissions
BEGIN SELECT RAISE(ABORT,'SHADOW_ADMISSION_IMMUTABLE'); END;
CREATE TRIGGER IF NOT EXISTS interpretation_shadow_admission_no_delete BEFORE DELETE ON interpretation_shadow_admissions
BEGIN SELECT RAISE(ABORT,'SHADOW_ADMISSION_IMMUTABLE'); END;
CREATE TRIGGER IF NOT EXISTS interpretation_shadow_observation_admitted BEFORE INSERT ON interpretation_shadow_observations
WHEN NOT EXISTS(SELECT 1 FROM interpretation_shadow_admissions a JOIN interpretation_shadow_windows w ON w.window_id=a.window_id
 WHERE a.observation_id=NEW.observation_id AND a.window_id=NEW.window_id AND a.sampled=1
 AND json_extract(NEW.observation_json,'$.sample_percent')=w.sample_percent AND NEW.observed_at>=w.started_at)
BEGIN SELECT RAISE(ABORT,'SHADOW_OBSERVATION_NOT_ADMITTED'); END;
CREATE TRIGGER IF NOT EXISTS interpretation_shadow_observation_revision AFTER INSERT ON interpretation_shadow_observations
BEGIN UPDATE interpretation_shadow_windows SET revision=revision+1 WHERE window_id=NEW.window_id; END;
CREATE TRIGGER IF NOT EXISTS interpretation_shadow_window_no_replace BEFORE INSERT ON interpretation_shadow_windows
WHEN EXISTS(SELECT 1 FROM interpretation_shadow_windows WHERE window_id=NEW.window_id)
BEGIN SELECT RAISE(ABORT,'SHADOW_WINDOW_ALREADY_EXISTS'); END;
CREATE TRIGGER IF NOT EXISTS interpretation_shadow_observation_no_replace BEFORE INSERT ON interpretation_shadow_observations
WHEN EXISTS(SELECT 1 FROM interpretation_shadow_observations WHERE observation_id=NEW.observation_id)
BEGIN SELECT RAISE(ABORT,'SHADOW_OBSERVATION_ALREADY_EXISTS'); END;
CREATE TRIGGER IF NOT EXISTS interpretation_shadow_admission_no_replace BEFORE INSERT ON interpretation_shadow_admissions
WHEN EXISTS(SELECT 1 FROM interpretation_shadow_admissions WHERE observation_id=NEW.observation_id)
BEGIN SELECT RAISE(IGNORE); END;
