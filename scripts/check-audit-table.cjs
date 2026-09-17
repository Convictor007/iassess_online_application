const { neon } = require('@neondatabase/serverless');
const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
  }
});

const sql = neon(env.DATABASE_URL);

async function check() {
  // Check if audit_logs exists
  const result = await sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'audit_logs'
    ) as exists
  `;
  console.log('audit_logs table exists:', result[0].exists);

  if (!result[0].exists) {
    console.log('Creating audit_logs table...');
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        audit_id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(120) NOT NULL,
        ip_address VARCHAR(45) NOT NULL DEFAULT '0.0.0.0',
        user_agent VARCHAR(255),
        details JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action)`;
    console.log('audit_logs table created successfully.');
  }
}

check().catch(e => { console.error(e); process.exit(1); });
