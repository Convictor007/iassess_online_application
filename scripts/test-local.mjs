import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env first
const envPath = resolve(import.meta.dirname, "../.env");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  process.env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
}

import { createTransaction, listTransactions, getFullTransaction, updateTransactionStatus } from "../api/lib/repository.mjs";
import { getSql } from "../api/lib/db.mjs";

console.log("=== Testing repository.mjs locally ===\n");

// Test create
console.log("1. Create transaction...");
let txnId;
try {
  txnId = await createTransaction({
    reference_number: "LOCAL-TEST-001",
    category: "assessment",
    submission_method: "online",
    assessment_type: "transfer_ownership",
    certifications: [],
    property: {
      owner_name: "Local Test Owner",
      barangay: "Poblacion",
      tax_declarations: ["TD-LOCAL-001"],
    },
    requestor: {
      name: "Local Test Requestor",
      address: "Zone 1",
      contact_number: "09171234567",
      email: "local@test.com",
      purpose: "Local test",
    },
  });
  console.log("   Created with id:", txnId);
} catch (e) {
  console.log("   ERROR:", e.message);
}

// Test list
console.log("\n2. List transactions...");
try {
  const rows = await listTransactions();
  console.log("   Found", rows.length, "transactions");
} catch (e) {
  console.log("   ERROR:", e.message);
}

// Test get
console.log("\n3. Get full transaction...");
try {
  const txn = await getFullTransaction("LOCAL-TEST-001");
  console.log("   Found:", txn ? txn.reference_number : "null");
  if (txn) {
    console.log("   owner_name:", txn.owner_name);
    console.log("   requestor_name:", txn.requestor_name);
    console.log("   category:", txn.category);
    console.log("   assessment_type:", txn.assessment_type);
  }
} catch (e) {
  console.log("   ERROR:", e.message);
}

// Test update
console.log("\n4. Update status...");
try {
  const updated = await updateTransactionStatus(txnId, "processing", "test");
  console.log("   Updated:", updated);
} catch (e) {
  console.log("   ERROR:", e.message);
}

// Verify update
console.log("\n5. Verify status change...");
try {
  const txn = await getFullTransaction("LOCAL-TEST-001");
  console.log("   Status:", txn.status);
} catch (e) {
  console.log("   ERROR:", e.message);
}

// Cleanup
console.log("\n6. Cleanup...");
try {
  const sql = getSql();
  await sql`DELETE FROM transactions WHERE reference_number = ${"LOCAL-TEST-001"}`;
  console.log("   Cleaned up");
} catch (e) {
  console.log("   ERROR:", e.message);
}

console.log("\n=== Done ===");
