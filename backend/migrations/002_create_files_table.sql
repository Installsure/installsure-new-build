-- Create files table
CREATE TABLE IF NOT EXISTS files (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index on filename for faster lookups
CREATE INDEX IF NOT EXISTS idx_files_filename ON files(filename);

-- Create index on file_type for filtering
CREATE INDEX IF NOT EXISTS idx_files_file_type ON files(file_type);

-- Create index on created_at for ordering
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);


