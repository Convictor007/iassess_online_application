import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";

const env = readFileSync(".env", "utf-8");
const match = env.match(/^DATABASE_URL=(.+)$/m);
const sql = neon(match[1].trim());

console.log("=== Testing Neon Connection ===\n");

// 1) List all tables
console.log("1. Tables in database:");
const tables = await sql.query(
  "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
);
tables.forEach((t) => console.log("   -", t.table_name));
console.log(`   Total: ${tables.length} tables\n`);

// 2) Insert a test application
console.log("2. Inserting test application...");
const [inserted] = await sql`
  INSERT INTO applications (
    reference_number, transaction_category, assessment_type, certification_selections,
    owner_name, tax_declarations, title_no, lot_no, block_no, street_name, barangay,
    requestor_name, requestor_address, requestor_contact, requestor_email, purpose, status
  ) VALUES (
    'TEST-NEON-001', 'assessment', 'transfer_ownership', '[]'::jsonb,
    'Juan Dela Cruz', '["TD-2024-001"]'::jsonb, 'T-12345', 'Lot 5', 'Block 3',
    'Rizal Street', 'Camangahan',
    'Maria Dela Cruz', 'Balatan, Camarines Sur', '09171234567', 'maria@test.com',
    'Transfer of ownership', 'pending'
  )
  RETURNING id, reference_number, status
`;
console.log("   Inserted:", inserted.reference_number, "| ID:", inserted.id, "| Status:", inserted.status, "\n");

// 3) Read it back by reference_number
console.log("3. Reading back by reference_number...");
const [found] = await sql`SELECT * FROM applications WHERE reference_number = 'TEST-NEON-001'`;
console.log("   Found:", found.requestor_name, "|", found.barangay, "|", found.status, "\n");

// 4) Update status
console.log("4. Updating status to 'processing'...");
const [updated] = await sql`
  UPDATE applications SET status = 'processing', updated_at = now()
  WHERE reference_number = 'TEST-NEON-001'
  RETURNING reference_number, status, updated_at
`;
console.log("   Updated:", updated.reference_number, "| Status:", updated.status, "\n");

// 5) Search with ILIKE
console.log("5. Searching with ILIKE '%Juan%'...");
const results = await sql`
  SELECT reference_number, owner_name, requestor_name FROM applications
  WHERE owner_name ILIKE '%Juan%'
`;
results.forEach((r) => console.log("   -", r.reference_number, "|", r.owner_name));
console.log();

// 6) Delete test record
console.log("6. Cleaning up test record...");
await sql`DELETE FROM applications WHERE reference_number = 'TEST-NEON-001'`;
const check = await sql`SELECT COUNT(*) as count FROM applications WHERE reference_number = 'TEST-NEON-001'`;
console.log("   Deleted. Remaining with TEST-NEON-001:", check[0].count, "\n");

// 7) Count all applications
console.log("7. Total applications in database:");
const [count] = await sql`SELECT COUNT(*) as count FROM applications`;
console.log("   ", count.count, "applications\n");

console.log("=== All tests passed ===");
