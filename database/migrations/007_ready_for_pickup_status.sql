-- Permit every status accepted by the assessor API, including the pickup step.
-- Keep legacy status values so existing rows remain valid.
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_status_check
  CHECK (status IN (
    'pending',
    'under_review',
    'processing',
    'for_review',
    'for_approval',
    'verified',
    'approved',
    'needs_revision',
    'scheduled',
    'ready_for_pickup',
    'completed',
    'cancelled',
    'canceled',
    'rejected',
    'expired'
  ));
