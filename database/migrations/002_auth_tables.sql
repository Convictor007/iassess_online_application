-- =====================================================
-- Auth Tables — 4-table role structure
-- users (core) + citizens, assessors, admins (role-specific)
-- =====================================================

-- 1) users — core login table (everyone has an account here)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('citizen', 'assessor', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- 2) user_profiles — shared profile data (1:1 with users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(120) NOT NULL DEFAULT '',
  last_name VARCHAR(120) NOT NULL DEFAULT '',
  phone_number VARCHAR(40),
  gender VARCHAR(40),
  date_of_birth DATE,
  profile_picture VARCHAR(512),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) user_addresses — shared addresses (1:N with users)
CREATE TABLE IF NOT EXISTS user_addresses (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  street_address VARCHAR(255),
  barangay VARCHAR(120),
  municipality VARCHAR(120) NOT NULL,
  province VARCHAR(120) NOT NULL,
  region VARCHAR(120),
  postal_code VARCHAR(20),
  is_primary BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_addr_user ON user_addresses(user_id);

-- 4) citizens — citizen-specific data (1:1 with users where role='citizen')
CREATE TABLE IF NOT EXISTS citizens (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  id_type VARCHAR(50),
  id_number VARCHAR(50),
  occupation VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5) assessors — assessor-specific data (1:1 with users where role='assessor')
-- Position hierarchy: appraiser → recommender → approver → head
CREATE TABLE IF NOT EXISTS assessors (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  employee_code VARCHAR(80),
  office_name VARCHAR(120),
  position VARCHAR(50) NOT NULL DEFAULT 'appraiser'
    CHECK (position IN ('appraiser', 'recommender', 'approver', 'head')),
  is_head BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6) admins — admin-specific data (1:1 with users where role='admin')
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  department VARCHAR(100),
  access_level VARCHAR(50) DEFAULT 'standard',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- Example: Get full user with role data
-- =====================================================

-- Get citizen with profile
-- SELECT u.*, p.first_name, p.last_name, p.phone_number, c.occupation
-- FROM users u
-- LEFT JOIN user_profiles p ON p.user_id = u.id
-- LEFT JOIN citizens c ON c.user_id = u.id
-- WHERE u.email = 'citizen@iassess.local';

-- Get assessor with profile
-- SELECT u.*, p.first_name, p.last_name, a.employee_code, a.office_name, a.is_head
-- FROM users u
-- LEFT JOIN user_profiles p ON p.user_id = u.id
-- LEFT JOIN assessors a ON a.user_id = u.id
-- WHERE u.email = 'assessor@iassess.local';

-- Get admin with profile
-- SELECT u.*, p.first_name, p.last_name, ad.department, ad.access_level
-- FROM users u
-- LEFT JOIN user_profiles p ON p.user_id = u.id
-- LEFT JOIN admins ad ON ad.user_id = u.id
-- WHERE u.email = 'admin@iassess.local';
