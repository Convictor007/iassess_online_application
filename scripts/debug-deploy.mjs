import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env
const envPath = resolve(import.meta.dirname, "../.env");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  process.env[trimmed.slice(0, eqIdx).trim()] = trimmed.slice(eqIdx + 1).trim();
}

// Test 1: Direct repository call
console.log("=== Test 1: Direct repository call ===");
import("../api/lib/repository.mjs").then(async (repo) => {
  try {
    const id = await repo.createTransaction({
      reference_number: "DEBUG-001",
      category: "assessment",
      assessment_type: "transfer_ownership",
      property: { owner_name: "Debug Owner", barangay: "Poblacion", tax_declarations: [] },
      requestor: { name: "Debug Requestor", address: "Zone 1", contact_number: "09171234567", email: "debug@test.com", purpose: "Debug" },
    });
    console.log("  Created id:", id);

    const txn = await repo.getFullTransaction("DEBUG-001");
    console.log("  Found:", txn?.reference_number, txn?.owner_name);

    // Cleanup
    const { getSql } = await import("../api/lib/db.mjs");
    const sql = getSql();
    const deleted = await sql`DELETE FROM transactions WHERE reference_number = ${"DEBUG-001"}`;
    console.log("  Cleaned up:", deleted.length, "rows");
  } catch (e) {
    console.log("  ERROR:", e.message);
    console.log("  Stack:", e.stack?.split("\n").slice(0, 5).join("\n"));
  }

  // Test 2: Live API
  console.log("\n=== Test 2: Live API ===");
  try {
    const res = await fetch("https://iassess.vercel.app/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referenceNumber: "LIVE-TEST-001",
        transactionCategory: "assessment",
        assessmentType: "transfer_ownership",
        ownerName: "Live Owner",
        barangay: "Poblacion",
        requestorName: "Live Requestor",
        requestorAddress: "Zone 1",
        requestorContact: "09171234567",
        requestorEmail: "live@test.com",
        purpose: "Live test",
      }),
    });
    const text = await res.text();
    console.log("  Status:", res.status);
    console.log("  Body:", text);
  } catch (e) {
    console.log("  ERROR:", e.message);
  }

  // Test 3: Check what Vercel is actually running
  console.log("\n=== Test 3: Check Vercel function output ===");
  try {
    const res = await fetch("https://iassess.vercel.app/api/applications?status=pending", {
      headers: { "x-api-key": process.env.MOBILE_API_KEY },
    });
    const text = await res.text();
    console.log("  Status:", res.status);
    console.log("  Body:", text.substring(0, 200));
  } catch (e) {
    console.log("  ERROR:", e.message);
  }
}).catch(e => console.log("Import error:", e.message));
