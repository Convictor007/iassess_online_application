import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(import.meta.dirname, "../.env");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  process.env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
}

const sql = neon(process.env.DATABASE_URL);
const API_KEY = process.env.MOBILE_API_KEY;
const BASE = "https://iassess.vercel.app";

let passed = 0;
let failed = 0;

function ok(name) { passed++; console.log(`  ✓ ${name}`); }
function fail(name, err) { failed++; console.log(`  ✗ ${name}: ${err}`); }

async function test(name, fn) {
  try {
    await fn();
    ok(name);
  } catch (e) {
    fail(name, e.message);
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}

// ─── Test 1: POST /api/applications (create transaction) ─────────────────
console.log("\n=== TEST 1: POST /api/applications ===");

let testRefNumber;
await test("Create assessment transaction", async () => {
  testRefNumber = `TEST-${Date.now().toString(36).toUpperCase()}`;
  const res = await fetch(`${BASE}/api/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      referenceNumber: testRefNumber,
      transactionCategory: "assessment",
      assessmentType: "transfer_ownership",
      certificationSelections: [],
      submissionMethod: "online",
      ownerName: "Test Owner",
      taxDeclarations: ["TD-TEST-001"],
      titleNo: "TCT-TEST-001",
      lotNo: "1234",
      blockNo: "5",
      streetName: "Test Street",
      barangay: "Poblacion",
      requestorName: "Test Requestor",
      requestorAddress: "Zone 1, Poblacion",
      requestorContact: "09171234567",
      requestorEmail: "test@test.com",
      purpose: "API test",
    }),
  });
  const data = await res.json();
  assert(res.ok, `Status ${res.status}: ${JSON.stringify(data)}`);
  assert(data.success === true, "success !== true");
  assert(data.referenceNumber === testRefNumber, "referenceNumber mismatch");
});

await test("Create certification transaction", async () => {
  const ref = `TEST-CERT-${Date.now().toString(36).toUpperCase()}`;
  const res = await fetch(`${BASE}/api/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      referenceNumber: ref,
      transactionCategory: "certification",
      certificationSelections: [{ type: "certified_true_copy", copies: 2 }],
      ownerName: "Cert Owner",
      taxDeclarations: ["TD-CERT-001"],
      barangay: "Duran",
      requestorName: "Cert Requestor",
      requestorAddress: "Zone 2, Duran",
      requestorContact: "09181234567",
      requestorEmail: "cert@test.com",
      purpose: "Cert test",
    }),
  });
  const data = await res.json();
  assert(res.ok, `Status ${res.status}: ${JSON.stringify(data)}`);
  assert(data.success === true, "success !== true");
});

await test("Reject missing required fields", async () => {
  const res = await fetch(`${BASE}/api/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ referenceNumber: "X" }),
  });
  assert(res.status === 400, `Expected 400, got ${res.status}`);
});

// ─── Test 2: GET /api/applications (list) ────────────────────────────────
console.log("\n=== TEST 2: GET /api/applications ===");

await test("List all applications (no auth)", async () => {
  const res = await fetch(`${BASE}/api/applications`);
  assert(res.status === 401, `Expected 401 without API key, got ${res.status}`);
});

await test("List all applications (with auth)", async () => {
  const res = await fetch(`${BASE}/api/applications`, {
    headers: { "x-api-key": API_KEY },
  });
  const data = await res.json();
  assert(res.ok, `Status ${res.status}`);
  assert(data.success === true, "success !== true");
  assert(Array.isArray(data.data), "data is not array");
  assert(data.data.length > 0, "data is empty");
});

await test("Filter by status", async () => {
  const res = await fetch(`${BASE}/api/applications?status=pending`, {
    headers: { "x-api-key": API_KEY },
  });
  const data = await res.json();
  assert(res.ok, `Status ${res.status}`);
  assert(Array.isArray(data.data), "data is not array");
});

await test("Search by term", async () => {
  const res = await fetch(`${BASE}/api/applications?search=Test`, {
    headers: { "x-api-key": API_KEY },
  });
  const data = await res.json();
  assert(res.ok, `Status ${res.status}`);
  assert(Array.isArray(data.data), "data is not array");
});

await test("Filter by category", async () => {
  const res = await fetch(`${BASE}/api/applications?category=assessment`, {
    headers: { "x-api-key": API_KEY },
  });
  const data = await res.json();
  assert(res.ok, `Status ${res.status}`);
  assert(Array.isArray(data.data), "data is not array");
});

// ─── Test 3: GET /api/applications?reference_number=X (track) ────────────
console.log("\n=== TEST 3: GET /api/applications?reference_number=X ===");

await test("Track by reference number", async () => {
  const res = await fetch(`${BASE}/api/applications?reference_number=${testRefNumber}`, {
    headers: { "x-api-key": API_KEY },
  });
  const data = await res.json();
  assert(res.ok, `Status ${res.status}`);
  assert(data.success === true, "success !== true");
  assert(data.data.reference_number === testRefNumber, "reference_number mismatch");
  assert(data.data.owner_name === "Test Owner", "owner_name mismatch");
  assert(data.data.requestor_name === "Test Requestor", "requestor_name mismatch");
  assert(data.data.category === "assessment", "category mismatch");
  assert(data.data.assessment_type === "transfer_ownership", "assessment_type mismatch");
});

await test("Track non-existent reference", async () => {
  const res = await fetch(`${BASE}/api/applications?reference_number=NONEXISTENT`, {
    headers: { "x-api-key": API_KEY },
  });
  assert(res.status === 404, `Expected 404, got ${res.status}`);
});

// ─── Test 4: GET /api/applications/:id ──────────────────────────────────
console.log("\n=== TEST 4: GET /api/applications/:id ===");

await test("Get by ID", async () => {
  // First get the ID from the reference
  const listRes = await fetch(`${BASE}/api/applications?reference_number=${testRefNumber}`, {
    headers: { "x-api-key": API_KEY },
  });
  const listData = await listRes.json();
  const txnId = listData.data.id;

  const res = await fetch(`${BASE}/api/applications/${txnId}`, {
    headers: { "x-api-key": API_KEY },
  });
  const data = await res.json();
  assert(res.ok, `Status ${res.status}`);
  assert(data.success === true, "success !== true");
  assert(data.data.id === txnId, "id mismatch");
  assert(data.data.reference_number === testRefNumber, "reference_number mismatch");
});

await test("Get non-existent ID", async () => {
  const res = await fetch(`${BASE}/api/applications/999999`, {
    headers: { "x-api-key": API_KEY },
  });
  assert(res.status === 404, `Expected 404, got ${res.status}`);
});

// ─── Test 5: PATCH /api/applications (update status) ────────────────────
console.log("\n=== TEST 5: PATCH /api/applications ===");

let testTxnId;
await test("Get transaction ID for update", async () => {
  const res = await fetch(`${BASE}/api/applications?reference_number=${testRefNumber}`, {
    headers: { "x-api-key": API_KEY },
  });
  const data = await res.json();
  testTxnId = data.data.id;
});

await test("Update status to processing", async () => {
  const res = await fetch(`${BASE}/api/applications`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    body: JSON.stringify({ id: testTxnId, status: "processing" }),
  });
  const data = await res.json();
  assert(res.ok, `Status ${res.status}: ${JSON.stringify(data)}`);
  assert(data.success === true, "success !== true");
});

await test("Verify status updated", async () => {
  const res = await fetch(`${BASE}/api/applications?reference_number=${testRefNumber}`, {
    headers: { "x-api-key": API_KEY },
  });
  const data = await res.json();
  assert(data.data.status === "processing", `Expected processing, got ${data.data.status}`);
});

await test("Update status to completed", async () => {
  const res = await fetch(`${BASE}/api/applications`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    body: JSON.stringify({ id: testTxnId, status: "completed" }),
  });
  const data = await res.json();
  assert(res.ok, `Status ${res.status}`);
});

await test("Reject invalid status", async () => {
  const res = await fetch(`${BASE}/api/applications`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
    body: JSON.stringify({ id: testTxnId, status: "invalid_status" }),
  });
  assert(res.status === 400, `Expected 400, got ${res.status}`);
});

// ─── Test 6: Verify related tables ──────────────────────────────────────
console.log("\n=== TEST 6: VERIFY RELATED TABLES ===");

await test("Assessments table has data", async () => {
  const rows = await sql`SELECT count(*) as count FROM assessments`;
  assert(Number(rows[0].count) > 0, `Expected > 0, got ${rows[0].count}`);
});

await test("Certifications table has data", async () => {
  const rows = await sql`SELECT count(*) as count FROM certifications`;
  assert(Number(rows[0].count) > 0, `Expected > 0, got ${rows[0].count}`);
});

await test("Properties table has data", async () => {
  const rows = await sql`SELECT count(*) as count FROM properties`;
  assert(Number(rows[0].count) > 0, `Expected > 0, got ${rows[0].count}`);
});

await test("Tax declarations table has data", async () => {
  const rows = await sql`SELECT count(*) as count FROM tax_declarations`;
  assert(Number(rows[0].count) > 0, `Expected > 0, got ${rows[0].count}`);
});

await test("Requestors table has data", async () => {
  const rows = await sql`SELECT count(*) as count FROM requestors`;
  assert(Number(rows[0].count) > 0, `Expected > 0, got ${rows[0].count}`);
});

await test("Status history table has data", async () => {
  const rows = await sql`SELECT count(*) as count FROM status_history`;
  assert(Number(rows[0].count) > 0, `Expected > 0, got ${rows[0].count}`);
});

// ─── Test 7: Cleanup test data ──────────────────────────────────────────
console.log("\n=== TEST 7: CLEANUP ===");

await test("Delete test transactions", async () => {
  const deleted = await sql`DELETE FROM transactions WHERE reference_number LIKE 'TEST-%' RETURNING id`;
  console.log(`    Deleted ${deleted.length} test transactions`);
});

// ─── Summary ────────────────────────────────────────────────────────────
console.log("\n========================================");
console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
console.log("========================================\n");

if (failed > 0) process.exit(1);
