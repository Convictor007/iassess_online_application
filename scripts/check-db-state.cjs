const { neon } = require('@neondatabase/serverless');
const path = require('path');
const fs = require('fs');

// Read .env manually
const envPath = path.resolve(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
    }
  }
});

const sql = neon(env.DATABASE_URL);

async function checkState() {
  console.log('=== Current DB State ===\n');

  const users = await sql`SELECT id, email, role, is_active FROM users ORDER BY id`;
  console.log(`Users (${users.length}):`);
  users.forEach(u => console.log(`  ${u.id}: ${u.email} [${u.role}] active=${u.is_active}`));

  const txns = await sql`SELECT id, reference_number, category, submission_method, status, assigned_to, created_at FROM transactions ORDER BY id`;
  console.log(`\nTransactions (${txns.length}):`);
  txns.forEach(t => console.log(`  ${t.id}: ${t.reference_number} [${t.category}/${t.status}] method=${t.submission_method} assigned=${t.assigned_to ?? 'none'}`));

  const assess = await sql`SELECT id, trn_id, assessment_type FROM assessments ORDER BY id`;
  console.log(`\nAssessments (${assess.length}):`);
  assess.forEach(a => console.log(`  ${a.id}: txn=${a.trn_id} type=${a.assessment_type}`));

  const certs = await sql`SELECT id, trn_id, cert_type, copies, fee FROM certifications ORDER BY id`;
  console.log(`\nCertifications (${certs.length}):`);
  certs.forEach(c => console.log(`  ${c.id}: txn=${c.trn_id} type=${c.cert_type} copies=${c.copies} fee=${c.fee}`));

  const props = await sql`SELECT id, trn_id, owner_name, barangay, lot_no FROM properties ORDER BY id`;
  console.log(`\nProperties (${props.length}):`);
  props.forEach(p => console.log(`  ${p.id}: txn=${p.trn_id} owner=${p.owner_name} brgy=${p.barangay} lot=${p.lot_no}`));

  const tds = await sql`SELECT id, trn_id, td_number FROM tax_declarations ORDER BY id`;
  console.log(`\nTax Declarations (${tds.length}):`);
  tds.forEach(t => console.log(`  ${t.id}: txn=${t.trn_id} td=${t.td_number}`));

  const reqs = await sql`SELECT id, trn_id, name, email FROM requestors ORDER BY id`;
  console.log(`\nRequestors (${reqs.length}):`);
  reqs.forEach(r => console.log(`  ${r.id}: txn=${r.trn_id} name=${r.name} email=${r.email}`));

  const steps = await sql`SELECT id, trn_id, step_order, role_required, status FROM online_approval_steps ORDER BY id`;
  console.log(`\nApproval Steps (${steps.length}):`);
  steps.forEach(s => console.log(`  ${s.id}: txn=${s.trn_id} step=${s.step_order} role=${s.role_required} status=${s.status}`));

  const hist = await sql`SELECT id, trn_id, new_status FROM status_history ORDER BY id`;
  console.log(`\nStatus History (${hist.length}):`);
  hist.forEach(h => console.log(`  ${h.id}: txn=${h.trn_id} status=${h.new_status}`));
}

checkState().catch(e => { console.error(e); process.exit(1); });
