-- 002: Mobile app tables for iassess_mobile
-- Converts MySQL schema to PostgreSQL for Supabase

-- ============================================================================
-- 1) IDENTITY / AUTH LAYER
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('citizen', 'assessor', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- ============================================================================
-- 2) SHARED USER PROFILE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id INT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  first_name VARCHAR(120) NOT NULL DEFAULT '',
  last_name VARCHAR(120) NOT NULL DEFAULT '',
  phone_number VARCHAR(40) DEFAULT NULL,
  gender VARCHAR(40) DEFAULT NULL,
  date_of_birth DATE DEFAULT NULL,
  profile_picture_file_name VARCHAR(512) DEFAULT NULL,
  profile_picture_mime_type VARCHAR(128) DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 3) ADDRESS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_addresses (
  address_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  street_address VARCHAR(255) DEFAULT NULL,
  barangay VARCHAR(120) DEFAULT NULL,
  municipality VARCHAR(120) NOT NULL,
  province VARCHAR(120) NOT NULL,
  region VARCHAR(120) DEFAULT NULL,
  postal_code VARCHAR(20) DEFAULT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_addresses_user ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_primary ON user_addresses(user_id, is_primary);

-- ============================================================================
-- 4) ROLE-SPECIFIC TABLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS property_owners (
  owner_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  id_document_file_name VARCHAR(512) DEFAULT NULL,
  id_document_mime_type VARCHAR(128) DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assessors (
  assessor_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  employee_code VARCHAR(80) DEFAULT NULL UNIQUE,
  office_name VARCHAR(120) DEFAULT NULL,
  is_head_assessor BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admins (
  admin_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 5) BUSINESS FLOW TABLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS transaction_requests (
  transaction_id SERIAL PRIMARY KEY,
  reference_number VARCHAR(80) NOT NULL UNIQUE,
  owner_user_id INT NOT NULL REFERENCES users(user_id),
  assigned_assessor_user_id INT DEFAULT NULL REFERENCES users(user_id) ON DELETE SET NULL,
  type VARCHAR(64) DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('canceled', 'pending', 'for_review', 'for_approval', 'approved', 'rejected', 'completed')),
  current_step INT DEFAULT 1,
  total_steps INT DEFAULT 3,
  property_id INT DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  assessor_notes TEXT DEFAULT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NULL,
  updated_at TIMESTAMPTZ DEFAULT NULL,
  completed_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_tr_status ON transaction_requests(status);
CREATE INDEX IF NOT EXISTS idx_tr_owner_user ON transaction_requests(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_tr_assessor_user ON transaction_requests(assigned_assessor_user_id);

CREATE TABLE IF NOT EXISTS approval_steps (
  step_id SERIAL PRIMARY KEY,
  transaction_id INT NOT NULL REFERENCES transaction_requests(transaction_id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  role_required TEXT NOT NULL CHECK (role_required IN ('appraiser', 'recommender', 'approver')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'approved', 'rejected', 'skipped')),
  assessor_user_id INT DEFAULT NULL REFERENCES users(user_id) ON DELETE SET NULL,
  notes TEXT DEFAULT NULL,
  reviewed_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_as_transaction ON approval_steps(transaction_id);
CREATE INDEX IF NOT EXISTS idx_as_status ON approval_steps(status);

CREATE TABLE IF NOT EXISTS property_details (
  property_id SERIAL PRIMARY KEY,
  transaction_id INT NOT NULL REFERENCES transaction_requests(transaction_id) ON DELETE CASCADE,
  pin VARCHAR(50) DEFAULT NULL,
  lot_no VARCHAR(50) DEFAULT NULL,
  cadastral_no VARCHAR(50) DEFAULT NULL,
  area_sqm DECIMAL(12,2) DEFAULT NULL,
  classification VARCHAR(50) DEFAULT NULL,
  actual_use VARCHAR(50) DEFAULT NULL,
  market_value DECIMAL(18,4) DEFAULT NULL,
  assessed_value DECIMAL(18,4) DEFAULT NULL,
  tax_declaration_no VARCHAR(50) DEFAULT NULL,
  title_no VARCHAR(50) DEFAULT NULL,
  owner_name VARCHAR(255) DEFAULT NULL,
  barangay VARCHAR(120) DEFAULT NULL,
  municipality VARCHAR(120) DEFAULT NULL,
  province VARCHAR(120) DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS request_documents (
  document_id SERIAL PRIMARY KEY,
  transaction_request_id INT NOT NULL REFERENCES transaction_requests(transaction_id) ON DELETE CASCADE,
  type VARCHAR(48) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('canceled', 'pending', 'approved', 'rejected')),
  file_name VARCHAR(512) NOT NULL,
  file_url VARCHAR(2048) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(128) NOT NULL,
  uploaded_by_user_id INT DEFAULT NULL REFERENCES users(user_id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gis_plots (
  gis_id SERIAL PRIMARY KEY,
  owner_user_id INT NOT NULL REFERENCES users(user_id),
  tie_points JSONB DEFAULT NULL,
  center_lat DECIMAL(10, 7) DEFAULT NULL,
  center_lng DECIMAL(10, 7) DEFAULT NULL,
  zoom DECIMAL(5, 2) DEFAULT NULL,
  polygon JSONB DEFAULT NULL,
  area DECIMAL(18, 4) DEFAULT NULL,
  perimeter DECIMAL(18, 4) DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gis_owner_user ON gis_plots(owner_user_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  audit_id SERIAL PRIMARY KEY,
  user_id INT DEFAULT NULL REFERENCES users(user_id) ON DELETE SET NULL,
  action VARCHAR(120) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_agent VARCHAR(255) DEFAULT NULL,
  details JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);

-- ============================================================================
-- 6) BILLING & PAYMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS billing_items (
  billing_id SERIAL PRIMARY KEY,
  transaction_id INT NOT NULL REFERENCES transaction_requests(transaction_id) ON DELETE CASCADE,
  account_code VARCHAR(50) DEFAULT NULL,
  account_title VARCHAR(150) NOT NULL,
  amount DECIMAL(18,4) NOT NULL DEFAULT 0,
  surcharge DECIMAL(18,4) NOT NULL DEFAULT 0,
  interest DECIMAL(18,4) NOT NULL DEFAULT 0,
  discount DECIMAL(18,4) NOT NULL DEFAULT 0,
  total DECIMAL(18,4) NOT NULL DEFAULT 0,
  description TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  payment_id SERIAL PRIMARY KEY,
  transaction_id INT NOT NULL REFERENCES transaction_requests(transaction_id) ON DELETE CASCADE,
  billing_id INT DEFAULT NULL REFERENCES billing_items(billing_id) ON DELETE SET NULL,
  receipt_no VARCHAR(50) NOT NULL UNIQUE,
  amount DECIMAL(18,4) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('gcash', 'maya', 'bank_transfer', 'over_counter')),
  reference_no VARCHAR(100) DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  paid_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS receipts (
  receipt_id SERIAL PRIMARY KEY,
  receipt_no VARCHAR(50) NOT NULL UNIQUE,
  transaction_id INT NOT NULL REFERENCES transaction_requests(transaction_id) ON DELETE CASCADE,
  payment_id INT NOT NULL REFERENCES payments(payment_id) ON DELETE CASCADE,
  items JSONB DEFAULT NULL,
  subtotal DECIMAL(18,4) NOT NULL DEFAULT 0,
  total DECIMAL(18,4) NOT NULL DEFAULT 0,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 7) BUSINESS PERMITS
-- ============================================================================
CREATE TABLE IF NOT EXISTS business_permits (
  permit_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  transaction_id INT DEFAULT NULL REFERENCES transaction_requests(transaction_id) ON DELETE SET NULL,
  business_name VARCHAR(255) NOT NULL,
  trade_name VARCHAR(255) DEFAULT NULL,
  address TEXT DEFAULT NULL,
  organization_type TEXT NOT NULL DEFAULT 'single' CHECK (organization_type IN ('single', 'partnership', 'corporation', 'cooperative')),
  barangay VARCHAR(120) DEFAULT NULL,
  municipality VARCHAR(120) DEFAULT NULL,
  province VARCHAR(120) DEFAULT NULL,
  application_type TEXT NOT NULL DEFAULT 'new' CHECK (application_type IN ('new', 'renew', 'add_lob', 'retire')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'active', 'expired')),
  permit_no VARCHAR(50) DEFAULT NULL,
  valid_from DATE DEFAULT NULL,
  valid_to DATE DEFAULT NULL,
  capital DECIMAL(18,4) DEFAULT NULL,
  gross_receipts DECIMAL(18,4) DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business_lobs (
  lob_id SERIAL PRIMARY KEY,
  permit_id INT NOT NULL REFERENCES business_permits(permit_id) ON DELETE CASCADE,
  lob_name VARCHAR(255) NOT NULL,
  lob_code VARCHAR(50) DEFAULT NULL,
  assessment_type TEXT NOT NULL DEFAULT 'fixed' CHECK (assessment_type IN ('fixed', 'percentage')),
  fixed_fee DECIMAL(18,4) DEFAULT NULL,
  gross_rate DECIMAL(8,4) DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 8) COMMUNITY TAX CERTIFICATE (CTC)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ctc_records (
  ctc_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  transaction_id INT DEFAULT NULL REFERENCES transaction_requests(transaction_id) ON DELETE SET NULL,
  ctc_type TEXT NOT NULL DEFAULT 'individual' CHECK (ctc_type IN ('individual', 'corporate')),
  annual_salary DECIMAL(18,4) DEFAULT NULL,
  business_gross DECIMAL(18,4) DEFAULT NULL,
  property_income DECIMAL(18,4) DEFAULT NULL,
  basic_tax DECIMAL(18,4) DEFAULT NULL,
  business_tax DECIMAL(18,4) DEFAULT NULL,
  property_tax DECIMAL(18,4) DEFAULT NULL,
  salary_tax DECIMAL(18,4) DEFAULT NULL,
  interest DECIMAL(18,4) DEFAULT NULL,
  total_tax DECIMAL(18,4) DEFAULT NULL,
  receipt_no VARCHAR(50) DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'paid', 'voided')),
  issued_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 9) ENABLE RLS (Row Level Security)
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessors ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE gis_plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_permits ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_lobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ctc_records ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access (mobile app uses service role or JWT)
CREATE POLICY "Authenticated full access" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON user_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON user_addresses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON property_owners FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON assessors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON admins FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON transaction_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON approval_steps FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON property_details FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON request_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON gis_plots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON audit_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON billing_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON receipts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON business_permits FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON business_lobs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated full access" ON ctc_records FOR ALL USING (true) WITH CHECK (true);
