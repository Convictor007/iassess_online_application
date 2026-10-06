-- Add free-text notes column for Other Certifications / Appearance inputs.
-- Neon/postgres: certifications table currently has (trn_id, cert_type, copies, fee)
-- only — no place to store what the citizen typed for "Other Certifications".

ALTER TABLE certifications
  ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN certifications.notes IS
  'Citizen free-text for Other Certifications / Appearance (e.g., exact cert requested).';
