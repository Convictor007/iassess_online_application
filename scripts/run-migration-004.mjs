import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../.env") });

async function runMigration() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const sql = neon(url);

  const statements = [
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS review_notes TEXT`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS appointment_date DATE`,
    `ALTER TABLE transactions ADD COLUMN IF NOT EXISTS appointment_expires_at TIMESTAMPTZ`,
    `ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_status_check`,
    `ALTER TABLE transactions ADD CONSTRAINT transactions_status_check CHECK (status IN ('pending', 'under_review', 'approved', 'needs_revision', 'rejected', 'scheduled', 'processing', 'completed', 'cancelled', 'expired'))`,
    `CREATE TABLE IF NOT EXISTS document_reviews (
      id SERIAL PRIMARY KEY,
      trn_id INT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
      doc_id INT REFERENCES documents(id) ON DELETE SET NULL,
      doc_type VARCHAR(30) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'needs_revision', 'rejected')),
      notes TEXT,
      reviewed_by VARCHAR(255),
      reviewed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_doc_review_txn ON document_reviews(trn_id)`,
    `CREATE INDEX IF NOT EXISTS idx_doc_review_status ON document_reviews(status)`,
    `CREATE TABLE IF NOT EXISTS appointment_history (
      id SERIAL PRIMARY KEY,
      trn_id INT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
      old_date DATE,
      new_date DATE NOT NULL,
      reason TEXT,
      changed_by VARCHAR(255),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_appt_history_txn ON appointment_history(trn_id)`,
  ];

  for (const stmt of statements) {
    try {
      await sql.query(stmt);
      console.log(`✓ ${stmt.substring(0, 70)}...`);
    } catch (err) {
      if (err.message?.includes("already exists") || err.message?.includes("duplicate")) {
        console.log(`- Skipped: ${stmt.substring(0, 70)}...`);
      } else {
        console.error(`✗ Failed: ${stmt.substring(0, 70)}...`);
        console.error(`  ${err.message}`);
      }
    }
  }

  console.log("\nMigration 004 completed!");
}

runMigration().catch(console.error);
