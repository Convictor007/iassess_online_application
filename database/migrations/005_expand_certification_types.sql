-- Expand certifications.cert_type CHECK to full ERPT CERTIFICATIONS menu
-- (Balatan). Fee schedule note: standard certs ₱100 current; tax mapping free.

ALTER TABLE certifications DROP CONSTRAINT IF EXISTS certifications_cert_type_check;

ALTER TABLE certifications
  ADD CONSTRAINT certifications_cert_type_check
  CHECK (cert_type IN (
    'certified_true_copy',
    'cert_land_holdings',
    'tax_declaration',
    'request_or',
    'request_ds',
    'true_extract_copy',
    'duplicate_td',
    'no_declared_property',
    'aggregate_land_holding',
    'latest_td',
    'land_with_improvement',
    'land_no_improvement',
    'td_at_death',
    'no_property_at_death',
    'property_history',
    'earliest_td',
    'effectivity_td',
    'tax_map_location',
    'appearance',
    'other_certifications'
  ));

-- Widen cert_type column if needed (some legacy rows / longer ids)
ALTER TABLE certifications ALTER COLUMN cert_type TYPE VARCHAR(50);
