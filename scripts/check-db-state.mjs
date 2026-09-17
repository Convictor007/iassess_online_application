import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '..', '.env') });

const sql = neon(process.env.DATABASE_URL);

async function checkState() {
  console.log('=== Current DB State ===\n');

  // Check users
  const users = await sql`SELECT id, email, role, is_active FROM users ORDER BY id`;
  console.log(`Users (${users.length}):`);
  users.forEach(u => console.log(`  ${u.id}: ${u.email} [${u.role}] active=${u.is_active}`));

  // Check transactions
  const txns = await sql`SELECT id, reference_number, category, submission_method, status, assigned_to, created_at FROM transactions ORDER BY id`;
  console.log(`\nTransactions (${txns.length}):`);
  txns.forEach(t => console.log(`  ${t.id}: ${t.reference_number} [${t.category}/${t.status}] method=${t.submission_method} assigned=${t.assigned_to ?? 'none'} created=${t.created_at}`));

  // Check assessments
  const assess = await sql`SELECT id, trn_id, assessment_type FROM assessments ORDER BY id`;
  console.log(`\nAssessments (${assess.length}):`);
  assess.forEach(a => console.log(`  ${a.id}: txn=${a.trn_id} type=${a.assessment_type}`));

  // Check certifications
  const certs = await sql`SELECT id, trn_id, cert_type, copies, fee FROM certifications ORDER BY id`;
  console.log(`\nCertifications (${certs.length}):`);
  certs.forEach(c => console.log(`  ${c.id}: txn=${c.trn_id} type=${c.cert_type} copies=${c.copies} fee=${c.fee}`));

  // Check properties
  const props = await sql`SELECT id, trn_id, owner_name, barangay, lot_no FROM properties ORDER BY id`;
  console.log(`\nProperties (${props.length}):`);
  props.forEach(p => console.log(`  ${p.id}: txn=${p.trn_id} owner=${p.owner_name} brgy=${p.barakgay} lot=${p.lot_no}`));

  // Check tax_declarations
  const tds = await sql`SELECT id, trn_id, td_number FROM tax_declarations ORDER BY id`;
  console.log(`\nTax Declarations (${tds.length}):`);
  tds.forEach(t => console.log(`  ${t.id}: txn=${t.trn_id} td=${t.td_number}`));

  // Check requestors
  const reqs = await sql`SELECT id, trn_id, name, email FROM requestors ORDER BY id`;
  console.log(`\nRequestors (${reqs.length}):`);
  reqs.forEach(r => console.log(`  ${r.id}: txn=${r.trn_id} name=${r.name} email=${r.email}`));

  // Check online_approval_steps
  const steps = await sql`SELECT id, trn_id, step_order, role_required, status FROM online_approval_steps ORDER BY id`;
  console.log(`\nApproval Steps (${steps.length}):`);
  steps.forEach(s => console.log(`  ${s.id}: txn=${s.trn_id} step=${s.step_order} role=${s.role_required} status=${s.status}`));
}

checkState().catch(e => { console.error(e); process.exit(1); });
