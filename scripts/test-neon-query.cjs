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

async function test() {
  // Test 1: Tagged template
  console.log('Test 1: Tagged template');
  const r1 = await sql`SELECT COUNT(*)::int AS cnt FROM transactions`;
  console.log('  Result:', r1[0]);

  // Test 2: Query function (no params)
  console.log('Test 2: Query function (no params)');
  const r2 = await sql('SELECT COUNT(*)::int AS cnt FROM transactions');
  console.log('  Result:', r2[0]);

  // Test 3: Query function with params
  console.log('Test 3: Query function with params');
  const r3 = await sql('SELECT COUNT(*)::int AS cnt FROM transactions WHERE status = $1', ['pending']);
  console.log('  Result:', r3[0]);

  // Test 4: Dynamic query with multiple params
  console.log('Test 4: Dynamic query with multiple params');
  const conditions = ['t.status = $1', 't.category = $2'];
  const values = ['pending', 'assessment'];
  const where = `WHERE ${conditions.join(' AND ')}`;
  const query = `SELECT COUNT(*)::int AS cnt FROM transactions t ${where}`;
  console.log('  Query:', query);
  console.log('  Values:', values);
  const r4 = await sql(query, values);
  console.log('  Result:', r4[0]);

  // Test 5: Dynamic query with no conditions
  console.log('Test 5: Dynamic query with no conditions');
  const r5 = await sql('SELECT COUNT(*)::int AS cnt FROM transactions', []);
  console.log('  Result:', r5[0]);

  console.log('\nAll tests passed!');
}

test().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
