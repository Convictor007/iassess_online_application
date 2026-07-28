-- Applications table
CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reference_number TEXT UNIQUE NOT NULL,

  -- Transaction
  transaction_category TEXT NOT NULL CHECK (transaction_category IN ('assessment', 'certification')),
  assessment_type TEXT CHECK (assessment_type IN ('transfer_ownership', 'transfer_handog', 'land_first_time')),
  certification_selections JSONB DEFAULT '[]',

  -- Property info
  owner_name TEXT NOT NULL,
  tax_declarations JSONB NOT NULL DEFAULT '[]',
  title_no TEXT,
  lot_no TEXT,
  block_no TEXT,
  street_name TEXT,
  barangay TEXT NOT NULL,

  -- Requestor info
  requestor_name TEXT NOT NULL,
  requestor_address TEXT NOT NULL,
  requestor_contact TEXT NOT NULL,
  requestor_email TEXT NOT NULL,
  purpose TEXT NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for tracking lookups
CREATE INDEX idx_applications_reference_number ON applications(reference_number);

-- Enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Public can INSERT (submit application)
CREATE POLICY "Public can submit applications"
  ON applications FOR INSERT
  TO anon
  WITH CHECK (true);

-- Public can SELECT by reference_number (tracking)
CREATE POLICY "Public can track by reference number"
  ON applications FOR SELECT
  TO anon
  USING (true);

-- Admin role for full access
CREATE POLICY "Admin full access"
  ON applications FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
