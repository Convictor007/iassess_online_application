-- =====================================================
-- Migration 004: Appointment Scheduling & Document Review
-- Adds appointment date, expiration, and review notes
-- =====================================================

-- 1) Add new columns to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS review_notes TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS appointment_date DATE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS appointment_expires_at TIMESTAMPTZ;

-- 2) Expand status CHECK to include review workflow states
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_status_check
  CHECK (status IN (
    'pending',           -- Initial submission
    'under_review',      -- Assessor reviewing documents
    'approved',          -- Documents approved, visit office
    'needs_revision',    -- Some docs need updating
    'rejected',          -- Application cannot be processed
    'scheduled',         -- Appointment confirmed
    'processing',        -- Application being processed
    'completed',         -- Done
    'cancelled',         -- Cancelled by user or system
    'expired'            -- Appointment expired
  ));

-- 3) Create document_reviews table for per-document review
CREATE TABLE IF NOT EXISTS document_reviews (
  id SERIAL PRIMARY KEY,
  trn_id INT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  doc_id INT REFERENCES documents(id) ON DELETE SET NULL,
  doc_type VARCHAR(30) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'needs_revision', 'rejected')),
  notes TEXT,
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doc_review_txn ON document_reviews(trn_id);
CREATE INDEX IF NOT EXISTS idx_doc_review_status ON document_reviews(status);

-- 4) Create appointment_history table
CREATE TABLE IF NOT EXISTS appointment_history (
  id SERIAL PRIMARY KEY,
  trn_id INT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  old_date DATE,
  new_date DATE NOT NULL,
  reason TEXT,
  changed_by VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appt_history_txn ON appointment_history(trn_id);

-- =====================================================
-- Notes:
-- - Appointment validity: 15 calendar days from approval
-- - Expiration: If citizen doesn't visit within 15 days,
--   status changes to 'expired' and they need to reapply
-- - Document review: Each uploaded doc can be individually
--   approved, needs revision, or rejected
-- - Status flow for online submission:
--   pending → under_review → approved/needs_revision/rejected
--   approved → scheduled (with appointment_date) → processing → completed
--   needs_revision → under_review (after resubmission)
-- - Status flow for walk-in:
--   pending → processing → completed
-- =====================================================
