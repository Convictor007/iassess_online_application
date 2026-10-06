import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../.env") });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  const sql = neon(url);

  console.log("=== certifications table columns (before) ===");
  const before = await sql`
    SELECT column_name, data_type, character_maximum_length
    FROM information_schema.columns
    WHERE table_name = 'certifications'
    ORDER BY ordinal_position
  `;
  console.table(before);

  console.log("\n=== running 005 CHECK expansion + 006 notes column ===");
  try {
    await sql`ALTER TABLE certifications DROP CONSTRAINT IF EXISTS certifications_cert_type_check`;
    await sql`
      ALTER TABLE certifications
      ADD CONSTRAINT certifications_cert_type_check
      CHECK (cert_type IN (
        'certified_true_copy','cert_land_holdings','tax_declaration',
        'request_or','request_ds','true_extract_copy','duplicate_td',
        'no_declared_property','aggregate_land_holding','latest_td',
        'land_with_improvement','land_no_improvement','td_at_death',
        'no_property_at_death','property_history','earliest_td',
        'effectivity_td','tax_map_location','appearance','other_certifications'
      ))
    `;
    await sql`ALTER TABLE certifications ALTER COLUMN cert_type TYPE VARCHAR(50)`;
    await sql`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS notes TEXT`;
    await sql`
      COMMENT ON COLUMN certifications.notes IS
      'Citizen free-text for Other Certifications / Appearance (e.g., exact cert requested).'
    `;
    console.log("OK: certifications CHECK expanded + notes column added");
  } catch (err) {
    console.error("Migration error:", err?.message || err);
  }

  console.log("\n=== certifications table columns (after) ===");
  const after = await sql`
    SELECT column_name, data_type, character_maximum_length
    FROM information_schema.columns
    WHERE table_name = 'certifications'
    ORDER BY ordinal_position
  `;
  console.table(after);
}

main().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
