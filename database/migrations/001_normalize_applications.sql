-- =====================================================
-- iassess Online Application — Normalized Schema
-- Splits the single `applications` table into 8 tables
-- All ids are INT with SERIAL auto-increment
-- =====================================================

-- 1) transactions — core record
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
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

-- 2) assessments — assessment-specific (1:1)
CREATE TABLE IF NOT EXISTS assessments (
  id SERIAL PRIMARY KEY,
  trn_id INT NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE CASCADE,
  assessment_type VARCHAR(30) NOT NULL
    CHECK (assessment_type IN ('transfer_ownership', 'transfer_handog', 'land_first_time'))
);

-- 3) certifications — cert selections (1:N)
CREATE TABLE IF NOT EXISTS certifications (
  id SERIAL PRIMARY KEY,
  trn_id INT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  cert_type VARCHAR(30) NOT NULL
    CHECK (cert_type IN ('certified_true_copy', 'cert_land_holdings', 'tax_declaration')),
  copies INT NOT NULL DEFAULT 1,
  fee DECIMAL(10,2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_cert_txn ON certifications(trn_id);

-- 4) properties — property info (1:1)
CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  trn_id INT NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE CASCADE,
  owner_name VARCHAR(255) NOT NULL,
  title_no VARCHAR(50),
  lot_no VARCHAR(50),
  block_no VARCHAR(50),
  street_name VARCHAR(100),
  barangay VARCHAR(100) NOT NULL
);

-- 5) tax_declarations — TD numbers (1:N)
CREATE TABLE IF NOT EXISTS tax_declarations (
  id SERIAL PRIMARY KEY,
  trn_id INT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  td_number VARCHAR(50) NOT NULL
);

CREATE INDEX idx_td_txn ON tax_declarations(trn_id);

-- 6) requestors — requestor info (1:1)
CREATE TABLE IF NOT EXISTS requestors (
  id SERIAL PRIMARY KEY,
  trn_id INT NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  contact_number VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  purpose TEXT NOT NULL
);

-- 7) documents — uploaded files (1:N)
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  trn_id INT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  doc_type VARCHAR(30) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  blob_pathname TEXT,
  mime_type VARCHAR(50),
  file_size BIGINT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_doc_txn ON documents(trn_id);
CREATE INDEX idx_doc_type ON documents(doc_type);

-- 8) status_history — audit trail (1:N)
CREATE TABLE IF NOT EXISTS status_history (
  id SERIAL PRIMARY KEY,
  trn_id INT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_by VARCHAR(255),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

CREATE INDEX idx_history_txn ON status_history(trn_id);

-- =====================================================
-- Example queries
-- =====================================================

-- Get full application by reference number
-- SELECT
--   t.*,
--   a.assessment_type,
--   p.owner_name, p.title_no, p.lot_no, p.barangay,
--   r.name AS requestor_name, r.email AS requestor_email
-- FROM transactions t
-- LEFT JOIN assessments a ON a.trn_id = t.id
-- LEFT JOIN properties p ON p.trn_id = t.id
-- LEFT JOIN requestors r ON r.trn_id = t.id
-- WHERE t.reference_number = 'BAL-MX4K2AB-7HK1';

-- Get certifications
-- SELECT * FROM certifications WHERE trn_id = $1;

-- Get documents
-- SELECT * FROM documents WHERE trn_id = $1;

-- Get tax declarations
-- SELECT * FROM tax_declarations WHERE trn_id = $1;

-- Get status history
-- SELECT * FROM status_history WHERE trn_id = $1 ORDER BY changed_at;
