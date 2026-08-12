-- 003: Fix RLS policies to allow anon access for mobile app
-- The mobile app uses the anon key, not authenticated role

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated full access" ON users;
DROP POLICY IF EXISTS "Authenticated full access" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated full access" ON user_addresses;
DROP POLICY IF EXISTS "Authenticated full access" ON property_owners;
DROP POLICY IF EXISTS "Authenticated full access" ON assessors;
DROP POLICY IF EXISTS "Authenticated full access" ON admins;
DROP POLICY IF EXISTS "Authenticated full access" ON transaction_requests;
DROP POLICY IF EXISTS "Authenticated full access" ON approval_steps;
DROP POLICY IF EXISTS "Authenticated full access" ON property_details;
DROP POLICY IF EXISTS "Authenticated full access" ON request_documents;
DROP POLICY IF EXISTS "Authenticated full access" ON gis_plots;
DROP POLICY IF EXISTS "Authenticated full access" ON audit_logs;
DROP POLICY IF EXISTS "Authenticated full access" ON billing_items;
DROP POLICY IF EXISTS "Authenticated full access" ON payments;
DROP POLICY IF EXISTS "Authenticated full access" ON receipts;
DROP POLICY IF EXISTS "Authenticated full access" ON business_permits;
DROP POLICY IF EXISTS "Authenticated full access" ON business_lobs;
DROP POLICY IF EXISTS "Authenticated full access" ON ctc_records;

-- Disable RLS entirely for mobile tables (the app handles auth via JWT)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE property_owners DISABLE ROW LEVEL SECURITY;
ALTER TABLE assessors DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE approval_steps DISABLE ROW LEVEL SECURITY;
ALTER TABLE property_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE request_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE gis_plots DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE billing_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE receipts DISABLE ROW LEVEL SECURITY;
ALTER TABLE business_permits DISABLE ROW LEVEL SECURITY;
ALTER TABLE business_lobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE ctc_records DISABLE ROW LEVEL SECURITY;
