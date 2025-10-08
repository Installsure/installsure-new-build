-- Create auth_users table for authentication
CREATE TABLE IF NOT EXISTS auth_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  company_id INTEGER,
  active BOOLEAN DEFAULT true,
  profile_image_url TEXT,
  phone VARCHAR(20),
  hourly_rate DECIMAL(8,2),
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_auth_users_email ON auth_users(email);

-- Create index on role for authorization queries
CREATE INDEX IF NOT EXISTS idx_auth_users_role ON auth_users(role);

-- Create index on company_id for company-based queries
CREATE INDEX IF NOT EXISTS idx_auth_users_company_id ON auth_users(company_id);

-- Create index on active status
CREATE INDEX IF NOT EXISTS idx_auth_users_active ON auth_users(active);

-- Add foreign key constraint to projects table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES auth_users(id);
    CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
  END IF;
END $$;

-- Create companies table for multi-tenant support
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  subscription_plan VARCHAR(50) DEFAULT 'free',
  max_users INTEGER DEFAULT 5,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key constraint to auth_users
ALTER TABLE auth_users ADD CONSTRAINT fk_auth_users_company_id 
  FOREIGN KEY (company_id) REFERENCES companies(id);

-- Create user_sessions table for session management (optional)
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_accessed TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Create index on token_hash for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);

-- Create index on expires_at for cleanup
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Create password_reset_tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index on token_hash for fast lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash);

-- Create index on expires_at for cleanup
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Create audit_log table for security tracking
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES auth_users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id INTEGER,
  ip_address INET,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index on user_id for user-specific queries
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);

-- Create index on action for action-specific queries
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);

-- Create index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_auth_users_updated_at BEFORE UPDATE ON auth_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default company
INSERT INTO companies (name, domain, subscription_plan, max_users) 
VALUES ('InstallSure Demo Company', 'installsure.com', 'enterprise', 100)
ON CONFLICT DO NOTHING;

-- Insert demo admin user (password: InstallSureDemo2024!)
INSERT INTO auth_users (
  email, name, password_hash, role, company_id, hourly_rate
) VALUES (
  'admin@installsure.com',
  'InstallSure Admin',
  '$argon2id$v=19$m=65536,t=3,p=1$dGVzdA$test', -- This will be updated by the application
  'admin',
  1,
  75.00
) ON CONFLICT (email) DO NOTHING;






