-- =====================================================
-- iassess Online Application — Normalized Schema
-- Splits the single `applications` table into 8 tables
-- =====================================================

-- 1) Core transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number VARCHAR(30) NOT NULL UNIQUE,
  category VARCHAR(20) NOT NULL CHECK (category IN ('assessment', 'certification')),
  submission_method VARCHAR(10) CHECK (submission_method IN ('walk_in', 'online')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_txn_reference ON transactions(reference_number);
CREATE INDEX idx_txn_status ON transactions(status);
CREATE INDEX idx_txn_category ON transactions(category);
CREATE INDEX idx_txn_created ON transactions(created_at DESC);

-- 2) Assessment details (1:1 with transaction)
CREATE TABLE IF NOT EXISTS transaction_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE CASCADE,
  assessment_type VARCHAR(30) NOT NULL
    CHECK (assessment_type IN ('transfer_ownership', 'transfer_handog', 'land_first_time'))
);

-- 3) Certification selections (1:N — can request multiple cert types)
CREATE TABLE IF NOT EXISTS transaction_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  cert_type VARCHAR(30) NOT NULL
    CHECK (cert_type IN ('certified_true_copy', 'cert_land_holdings')),
  copies INT NOT NULL DEFAULT 1,
  fee DECIMAL(10,2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_cert_txn ON transaction_certifications(transaction_id);

-- 4) Property information (1:1 with transaction)
CREATE TABLE IF NOT EXISTS transaction_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE CASCADE,
  owner_name VARCHAR(255) NOT NULL,
  title_no VARCHAR(50),
  lot_no VARCHAR(50),
  block_no VARCHAR(50),
  street_name VARCHAR(100),
  barangay VARCHAR(100) NOT NULL
);

-- 5) Tax declarations (1:N — property can have multiple TDs)
CREATE TABLE IF NOT EXISTS transaction_tax_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  td_number VARCHAR(50) NOT NULL
);

CREATE INDEX idx_td_txn ON transaction_tax_declarations(transaction_id);

-- 6) Requestor information (1:1 with transaction)
CREATE TABLE IF NOT EXISTS transaction_requestors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  contact_number VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  purpose TEXT NOT NULL
);

-- 7) Uploaded documents (1:N — multiple files per transaction)
CREATE TABLE IF NOT EXISTS transaction_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  doc_type VARCHAR(30) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  blob_pathname TEXT,
  mime_type VARCHAR(50),
  file_size BIGINT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_doc_txn ON transaction_documents(transaction_id);
CREATE INDEX idx_doc_type ON transaction_documents(doc_type);

-- 8) Status change history (1:N — audit trail)
CREATE TABLE IF NOT EXISTS transaction_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_by VARCHAR(255),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

CREATE INDEX idx_history_txn ON transaction_status_history(transaction_id);

-- =====================================================
-- Example queries
-- =====================================================

-- Get full application by reference number
-- SELECT
--   t.*,
--   ta.assessment_type,
--   tp.owner_name, tp.title_no, tp.lot_no, tp.barangay,
--   tr.name AS requestor_name, tr.email AS requestor_email
-- FROM transactions t
-- LEFT JOIN transaction_assessments ta ON ta.transaction_id = t.id
-- LEFT JOIN transaction_properties tp ON tp.transaction_id = t.id
-- LEFT JOIN transaction_requestors tr ON tr.transaction_id = t.id
-- WHERE t.reference_number = 'BAL-MX4K2AB-7HK1';

-- Get certifications
-- SELECT * FROM transaction_certifications WHERE transaction_id = $1;

-- Get documents
-- SELECT * FROM transaction_documents WHERE transaction_id = $1;

-- Get tax declarations
-- SELECT * FROM transaction_tax_declarations WHERE transaction_id = $1;

-- Get status history
-- SELECT * FROM transaction_status_history WHERE transaction_id = $1 ORDER BY changed_at;
