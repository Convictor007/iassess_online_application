-- =====================================================
-- Migration 003: Online Application Workflow
-- Adds assignment support and approval steps
-- =====================================================

-- 1) Add assigned_to column to transactions
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS assigned_to INT REFERENCES users(id);

-- 2) Expand status CHECK to include workflow states
-- Drop old constraint, add new one with all statuses
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_status_check
  CHECK (status IN ('pending', 'processing', 'for_review', 'for_approval', 'completed', 'cancelled', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_txn_assigned ON transactions(assigned_to);

-- 3) Create online_approval_steps table
CREATE TABLE IF NOT EXISTS online_approval_steps (
  id SERIAL PRIMARY KEY,
  trn_id INT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  step_order INT NOT NULL,
  role_required VARCHAR(20) NOT NULL
    CHECK (role_required IN ('appraiser', 'recommender', 'approver', 'head')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'approved', 'rejected')),
  assessor_user_id INT REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approval_txn ON online_approval_steps(trn_id);
CREATE INDEX IF NOT EXISTS idx_approval_status ON online_approval_steps(status);

-- =====================================================
-- Notes:
-- - Status flow: pending → processing → for_review → for_approval → completed
-- - Rejected: any status → rejected
-- - Approval chain: appraiser (step 1) → recommender (step 2) → approver (step 3) → head (step 4)
-- - Each step must be approved before the next unlocks
-- =====================================================
