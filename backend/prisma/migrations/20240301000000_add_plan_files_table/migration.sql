-- Migration: add_plan_files_table
-- Adds the plan_files table with checksum-based deduplication and performance indexes.

-- Create plan_files table
CREATE TABLE IF NOT EXISTS plan_files (
  id            VARCHAR(36)  PRIMARY KEY,
  project_id    VARCHAR(36),
  uploaded_by_id VARCHAR(36),
  name          VARCHAR(255) NOT NULL,
  type          VARCHAR(50)  NOT NULL,
  path          TEXT         NOT NULL,
  checksum      VARCHAR(64)  NOT NULL,
  size          BIGINT       NOT NULL,
  mime_type     VARCHAR(100) NOT NULL,
  metadata      JSONB,
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT plan_files_checksum_unique UNIQUE (checksum)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_plan_files_checksum        ON plan_files (checksum);
CREATE INDEX IF NOT EXISTS idx_plan_files_project_id      ON plan_files (project_id);
CREATE INDEX IF NOT EXISTS idx_plan_files_uploaded_by_id  ON plan_files (uploaded_by_id);
CREATE INDEX IF NOT EXISTS idx_plan_files_created_at      ON plan_files (created_at);

-- Foreign-key to projects table (only applied if the projects table uses the same id type)
-- Wrapped in a DO block so the migration stays idempotent even when the FK already exists.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_plan_files_project'
  ) THEN
    ALTER TABLE plan_files
      ADD CONSTRAINT fk_plan_files_project
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE SET NULL;
  END IF;
END $$;

-- Trigger to keep updated_at current
CREATE OR REPLACE FUNCTION set_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_plan_files_updated_at ON plan_files;
CREATE TRIGGER trg_plan_files_updated_at
  BEFORE UPDATE ON plan_files
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
