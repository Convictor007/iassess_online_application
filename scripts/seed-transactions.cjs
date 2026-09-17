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

// ─── Seed Data ───────────────────────────────────────────────────────────────

const barangays = [
  'Poblacion', 'San Juan', 'Siramag', 'Tapayas', 'Aring',
  'Baclav', 'Benitinan', 'Buenavista', 'Buhi', 'Cagbibi',
  'Cagmanaba', 'Calagucon', 'Caramoan', 'Codon', 'Comagancing'
];

const assessorUsers = [2, 4]; // assessor@iassess.local, dareyes@my.cspc.edu.ph

// Helper: generate reference number
function refNum(n) {
  const ts = (Date.now() - n * 60000).toString(36).toUpperCase().slice(0, 8);
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BAL-${ts}-${rand}`;
}

// Transaction definitions: [category, assessmentType|certType, method, status, assignedTo, property, requestor]
const transactions = [
  // ── COMPLETED (5) ──────────────────────────────────────
  {
    category: 'assessment',
    assessmentType: 'transfer_ownership',
    method: 'online',
    status: 'completed',
    assignedTo: 4,
    property: { owner_name: 'Juan Dela Cruz', title_no: 'TCT-00123', lot_no: 'Lot 1', barangay: 'Poblacion' },
    requestor: { name: 'Juan Dela Cruz', address: 'Poblacion, Balatan, Camarines Sur', contact: '09171234567', email: 'juan.delacruz@gmail.com', purpose: 'Transfer of land ownership due to sale' },
    tds: ['TD-2024-0001'],
  },
  {
    category: 'assessment',
    assessmentType: 'transfer_ownership',
    method: 'walk_in',
    status: 'completed',
    assignedTo: 2,
    property: { owner_name: 'Maria Garcia', title_no: 'TCT-00456', lot_no: 'Lot 5', block_no: 'Block 3', street_name: 'Rizal St', barangay: 'San Juan' },
    requestor: { name: 'Pedro Garcia', address: 'San Juan, Balatan, Camarines Sur', contact: '09181234567', email: 'pedro.garcia@gmail.com', purpose: 'Transfer of ownership - inheritance' },
    tds: ['TD-2024-0055', 'TD-2024-0056'],
  },
  {
    category: 'certification',
    certSelections: [{ cert_type: 'certified_true_copy', copies: 2, fee: 50 }],
    method: 'online',
    status: 'completed',
    property: { owner_name: 'Roberto Santos', title_no: 'TCT-00789', lot_no: 'Lot 10', barangay: 'Siramag' },
    requestor: { name: 'Roberto Santos', address: 'Siramag, Balatan, Camarines Sur', contact: '09191234567', email: 'roberto.santos@yahoo.com', purpose: 'Need certified true copy for bank loan application' },
    tds: ['TD-2024-0089'],
  },
  {
    category: 'assessment',
    assessmentType: 'land_first_time',
    method: 'walk_in',
    status: 'completed',
    assignedTo: 4,
    property: { owner_name: 'Ana Reyes', title_no: null, lot_no: 'Lot 15', barangay: 'Tapayas' },
    requestor: { name: 'Ana Reyes', address: 'Tapayas, Balatan, Camarines Sur', contact: '09201234567', email: 'ana.reyes@gmail.com', purpose: 'First-time land assessment for new property' },
    tds: ['TD-2024-0101'],
  },
  {
    category: 'certification',
    certSelections: [
      { cert_type: 'certified_true_copy', copies: 1, fee: 25 },
      { cert_type: 'tax_declaration', copies: 1, fee: 25 },
    ],
    method: 'online',
    status: 'completed',
    property: { owner_name: 'Carlos Mendoza', title_no: 'TCT-00321', lot_no: 'Lot 8', barangay: 'Aring' },
    requestor: { name: 'Liza Mendoza', address: 'Aring, Balatan, Camarines Sur', contact: '09211234567', email: 'liza.mendoza@gmail.com', purpose: 'Documents needed for court proceedings' },
    tds: ['TD-2024-0077'],
  },

  // ── FOR_APPROVAL (3) ───────────────────────────────────
  {
    category: 'assessment',
    assessmentType: 'transfer_ownership',
    method: 'online',
    status: 'for_approval',
    assignedTo: 4,
    property: { owner_name: 'Gregorio Villanueva', title_no: 'TCT-00654', lot_no: 'Lot 20', barangay: 'Baclav' },
    requestor: { name: 'Gregorio Villanueva', address: 'Baclav, Balatan, Camarines Sur', contact: '09221234567', email: 'gregorio.v@gmail.com', purpose: 'Transfer ownership to heir' },
    tds: ['TD-2024-0112', 'TD-2024-0113'],
    approvalSteps: [
      { step: 1, role: 'appraiser', status: 'approved', assessor: 4 },
      { step: 2, role: 'recommender', status: 'approved', assessor: 2 },
      { step: 3, role: 'approver', status: 'in_progress', assessor: null },
    ],
  },
  {
    category: 'assessment',
    assessmentType: 'transfer_handog',
    method: 'walk_in',
    status: 'for_approval',
    assignedTo: 2,
    property: { owner_name: 'Elena Ramos', title_no: 'TCT-00888', lot_no: 'Lot 25', block_no: 'Block 1', street_name: 'Mabini St', barangay: 'Poblacion' },
    requestor: { name: 'Miguel Ramos', address: 'Poblacion, Balatan, Camarines Sur', contact: '09231234567', email: 'miguel.ramos@gmail.com', purpose: 'Handog (donation) of property to family member' },
    tds: ['TD-2024-0130'],
    approvalSteps: [
      { step: 1, role: 'appraiser', status: 'approved', assessor: 2 },
      { step: 2, role: 'recommender', status: 'approved', assessor: 4 },
      { step: 3, role: 'approver', status: 'approved', assessor: 4 },
      { step: 4, role: 'head', status: 'in_progress', assessor: null },
    ],
  },
  {
    category: 'assessment',
    assessmentType: 'transfer_ownership',
    method: 'online',
    status: 'for_approval',
    assignedTo: 4,
    property: { owner_name: 'Isabela Fernandez', title_no: 'TCT-00999', lot_no: 'Lot 30', barangay: 'Benitinan' },
    requestor: { name: 'Isabela Fernandez', address: 'Benitinan, Balatan, Camarines Sur', contact: '09241234567', email: 'isabela.f@gmail.com', purpose: 'Transfer after purchase of agricultural land' },
    tds: ['TD-2024-0145', 'TD-2024-0146'],
    approvalSteps: [
      { step: 1, role: 'appraiser', status: 'approved', assessor: 4 },
      { step: 2, role: 'recommender', status: 'in_progress', assessor: null },
    ],
  },

  // ── FOR_REVIEW (3) ─────────────────────────────────────
  {
    category: 'assessment',
    assessmentType: 'transfer_ownership',
    method: 'walk_in',
    status: 'for_review',
    assignedTo: 2,
    property: { owner_name: 'Ricardo Bautista', title_no: 'TCT-01111', lot_no: 'Lot 35', barangay: 'Buenavista' },
    requestor: { name: 'Ricardo Bautista', address: 'Buenavista, Balatan, Camarines Sur', contact: '09251234567', email: 'ricardo.b@gmail.com', purpose: 'Ownership transfer - land sale' },
    tds: ['TD-2024-0160'],
    approvalSteps: [
      { step: 1, role: 'appraiser', status: 'in_progress', assessor: 2 },
    ],
  },
  {
    category: 'assessment',
    assessmentType: 'land_first_time',
    method: 'online',
    status: 'for_review',
    assignedTo: 4,
    property: { owner_name: 'Sofia Lim', title_no: null, lot_no: 'Lot 40', barangay: 'Buhi' },
    requestor: { name: 'Sofia Lim', address: 'Buhi, Balatan, Camarines Sur', contact: '09261234567', email: 'sofia.lim@gmail.com', purpose: 'Newly acquired land needs first-time assessment' },
    tds: ['TD-2024-0175'],
    approvalSteps: [
      { step: 1, role: 'appraiser', status: 'in_progress', assessor: 4 },
    ],
  },
  {
    category: 'certification',
    certSelections: [{ cert_type: 'cert_land_holdings', copies: 3, fee: 75 }],
    method: 'walk_in',
    status: 'for_review',
    assignedTo: 2,
    property: { owner_name: 'Antonio Cruz', title_no: 'TCT-01234', lot_no: 'Lot 45', barangay: 'Cagbibi' },
    requestor: { name: 'Antonio Cruz', address: 'Cagbibi, Balatan, Camarines Sur', contact: '09271234567', email: 'antonio.cruz@gmail.com', purpose: 'Certification of land holdings for business permit' },
    tds: ['TD-2024-0190'],
  },

  // ── PROCESSING (4) ─────────────────────────────────────
  {
    category: 'assessment',
    assessmentType: 'transfer_ownership',
    method: 'online',
    status: 'processing',
    assignedTo: 4,
    property: { owner_name: 'Carmen Aquino', title_no: 'TCT-01345', lot_no: 'Lot 50', barangay: 'Cagmanaba' },
    requestor: { name: 'Carmen Aquino', address: 'Cagmanaba, Balatan, Camarines Sur', contact: '09281234567', email: 'carmen.aquino@gmail.com', purpose: 'Property transfer after death of title holder' },
    tds: ['TD-2024-0200', 'TD-2024-0201'],
  },
  {
    category: 'assessment',
    assessmentType: 'transfer_handog',
    method: 'walk_in',
    status: 'processing',
    assignedTo: 2,
    property: { owner_name: 'Fernando Gonzales', title_no: 'TCT-01456', lot_no: 'Lot 55', block_no: 'Block 2', street_name: 'Bonifacio St', barangay: 'Poblacion' },
    requestor: { name: 'Teresa Gonzales', address: 'Poblacion, Balatan, Camarines Sur', contact: '09291234567', email: 'teresa.g@gmail.com', purpose: 'Donation of land to daughter' },
    tds: ['TD-2024-0215'],
  },
  {
    category: 'certification',
    certSelections: [
      { cert_type: 'certified_true_copy', copies: 5, fee: 125 },
      { cert_type: 'cert_land_holdings', copies: 2, fee: 50 },
    ],
    method: 'online',
    status: 'processing',
    assignedTo: 4,
    property: { owner_name: 'Patricia Tolentino', title_no: 'TCT-01567', lot_no: 'Lot 60', barangay: 'Calagucon' },
    requestor: { name: 'Patricia Tolentino', address: 'Calagucon, Balatan, Camarines Sur', contact: '09301234567', email: 'patricia.t@gmail.com', purpose: 'Multiple certifications for legal dispute resolution' },
    tds: ['TD-2024-0230'],
  },
  {
    category: 'assessment',
    assessmentType: 'land_first_time',
    method: 'walk_in',
    status: 'processing',
    assignedTo: 2,
    property: { owner_name: 'Rafael Domínguez', title_no: null, lot_no: 'Lot 65', barangay: 'Codon' },
    requestor: { name: 'Rafael Domínguez', address: 'Codon, Balatan, Camarines Sur', contact: '09311234567', email: 'rafael.d@gmail.com', purpose: 'First-time assessment for inherited land' },
    tds: ['TD-2024-0245'],
  },

  // ── PENDING (5) ────────────────────────────────────────
  {
    category: 'assessment',
    assessmentType: 'transfer_ownership',
    method: 'online',
    status: 'pending',
    property: { owner_name: 'José Rizal-Manalo', title_no: 'TCT-01678', lot_no: 'Lot 70', barangay: 'Poblacion' },
    requestor: { name: 'José Rizal-Manalo', address: 'Poblacion, Balatan, Camarines Sur', contact: '09321234567', email: 'jose.rm@gmail.com', purpose: 'Transfer of agricultural land title' },
    tds: ['TD-2024-0260'],
  },
  {
    category: 'assessment',
    assessmentType: 'transfer_ownership',
    method: 'walk_in',
    status: 'pending',
    property: { owner_name: 'Grace Poe-Santos', title_no: 'TCT-01789', lot_no: 'Lot 75', barangay: 'San Juan' },
    requestor: { name: 'Grace Poe-Santos', address: 'San Juan, Balatan, Camarines Sur', contact: '09331234567', email: 'grace.ps@gmail.com', purpose: 'Property sale and title transfer' },
    tds: ['TD-2024-0275', 'TD-2024-0276'],
  },
  {
    category: 'certification',
    certSelections: [{ cert_type: 'certified_true_copy', copies: 1, fee: 25 }],
    method: 'online',
    status: 'pending',
    property: { owner_name: 'Manny Pacquiao', title_no: 'TCT-01890', lot_no: 'Lot 80', barangay: 'Siramag' },
    requestor: { name: 'Jinkee Pacquiao', address: 'Siramag, Balatan, Camarines Sur', contact: '09341234567', email: 'jinkee.p@gmail.com', purpose: 'CTC for school enrollment requirement' },
    tds: ['TD-2024-0290'],
  },
  {
    category: 'assessment',
    assessmentType: 'transfer_handog',
    method: 'walk_in',
    status: 'pending',
    property: { owner_name: 'Leni Robredo', title_no: 'TCT-01999', lot_no: 'Lot 85', block_no: 'Block 4', street_name: 'Aguinaldo St', barangay: 'Aring' },
    requestor: { name: 'Leni Robredo', address: 'Aring, Balatan, Camarines Sur', contact: '09351234567', email: 'leni.r@gmail.com', purpose: 'Donate residential lot to community foundation' },
    tds: ['TD-2024-0305'],
  },
  {
    category: 'certification',
    certSelections: [
      { cert_type: 'certified_true_copy', copies: 2, fee: 50 },
      { cert_type: 'tax_declaration', copies: 2, fee: 50 },
    ],
    method: 'online',
    status: 'pending',
    property: { owner_name: 'Bong Revilla', title_no: 'TCT-02000', lot_no: 'Lot 90', barangay: 'Baclav' },
    requestor: { name: 'Lovi Poe', address: 'Baclav, Balatan, Camarines Sur', contact: '09361234567', email: 'lovi.p@gmail.com', purpose: 'Needed for real estate transaction documentation' },
    tds: ['TD-2024-0320', 'TD-2024-0321'],
  },

  // ── REJECTED (2) ───────────────────────────────────────
  {
    category: 'assessment',
    assessmentType: 'transfer_ownership',
    method: 'walk_in',
    status: 'rejected',
    assignedTo: 2,
    property: { owner_name: 'Willie Revillame', title_no: 'TCT-02111', lot_no: 'Lot 95', barangay: 'Cagbibi' },
    requestor: { name: 'Willie Revillame', address: 'Cagbibi, Balatan, Camarines Sur', contact: '09371234567', email: 'willie.r@gmail.com', purpose: 'Transfer title to new buyer' },
    tds: ['TD-2024-0335'],
    approvalSteps: [
      { step: 1, role: 'appraiser', status: 'approved', assessor: 2 },
      { step: 2, role: 'recommender', status: 'rejected', assessor: 4 },
    ],
  },
  {
    category: 'certification',
    certSelections: [{ cert_type: 'cert_land_holdings', copies: 1, fee: 25 }],
    method: 'online',
    status: 'rejected',
    assignedTo: 4,
    property: { owner_name: 'Vic Sotto', title_no: 'TCT-02222', lot_no: 'Lot 100', barangay: 'Buenavista' },
    requestor: { name: 'Vic Sotto', address: 'Buenavista, Balatan, Camarines Sur', contact: '09381234567', email: 'vic.s@gmail.com', purpose: 'Certification for loan collateral' },
    tds: ['TD-2024-0350'],
  },

  // ── CANCELLED (2) ──────────────────────────────────────
  {
    category: 'assessment',
    assessmentType: 'land_first_time',
    method: 'online',
    status: 'cancelled',
    property: { owner_name: 'Piolo Pascual', title_no: null, lot_no: 'Lot 105', barangay: 'Tapayas' },
    requestor: { name: 'Piolo Pascual', address: 'Tapayas, Balatan, Camarines Sur', contact: '09391234567', email: 'piolo.p@gmail.com', purpose: 'Abandoned - decided not to proceed with assessment' },
    tds: ['TD-2024-0365'],
  },
  {
    category: 'certification',
    certSelections: [{ cert_type: 'certified_true_copy', copies: 3, fee: 75 }],
    method: 'walk_in',
    status: 'cancelled',
    property: { owner_name: 'Dawn Zulueta', title_no: 'TCT-02333', lot_no: 'Lot 110', barangay: 'Aring' },
    requestor: { name: 'Dawn Zulueta', address: 'Aring, Balatan, Camarines Sur', contact: '09401234567', email: 'dawn.z@gmail.com', purpose: 'Cancelled - found original copy' },
    tds: ['TD-2024-0380'],
  },
];

async function seed() {
  console.log('=== Seeding Transactions ===\n');

  // Step 1: Clean up existing data (keep users)
  console.log('Cleaning up existing transaction data...');
  await sql`DELETE FROM online_approval_steps`;
  await sql`DELETE FROM status_history`;
  await sql`DELETE FROM requestors`;
  await sql`DELETE FROM tax_declarations`;
  await sql`DELETE FROM properties`;
  await sql`DELETE FROM certifications`;
  await sql`DELETE FROM assessments`;
  await sql`DELETE FROM transactions`;
  console.log('  Done.\n');

  let created = 0;

  for (const txn of transactions) {
    const ref = refNum(created);

    // Insert transaction
    const rows = await sql`
      INSERT INTO transactions (reference_number, category, submission_method, status, notes, assigned_to)
      VALUES (${ref}, ${txn.category}, ${txn.method}, ${txn.status}, NULL, ${txn.assignedTo ?? null})
      RETURNING id
    `;
    const trnId = rows[0].id;

    // Insert assessment or certifications
    if (txn.category === 'assessment' && txn.assessmentType) {
      await sql`INSERT INTO assessments (trn_id, assessment_type) VALUES (${trnId}, ${txn.assessmentType})`;
    }
    if (txn.category === 'certification' && txn.certSelections) {
      for (const sel of txn.certSelections) {
        await sql`INSERT INTO certifications (trn_id, cert_type, copies, fee) VALUES (${trnId}, ${sel.cert_type}, ${sel.copies}, ${sel.fee})`;
      }
    }

    // Insert property
    const p = txn.property;
    await sql`
      INSERT INTO properties (trn_id, owner_name, title_no, lot_no, block_no, street_name, barangay)
      VALUES (${trnId}, ${p.owner_name}, ${p.title_no ?? null}, ${p.lot_no ?? null}, ${p.block_no ?? null}, ${p.street_name ?? null}, ${p.barangay})
    `;

    // Insert tax declarations
    for (const td of txn.tds) {
      await sql`INSERT INTO tax_declarations (trn_id, td_number) VALUES (${trnId}, ${td})`;
    }

    // Insert requestor
    const r = txn.requestor;
    await sql`
      INSERT INTO requestors (trn_id, name, address, contact_number, email, purpose)
      VALUES (${trnId}, ${r.name}, ${r.address}, ${r.contact}, ${r.email}, ${r.purpose})
    `;

    // Insert status history
    await sql`
      INSERT INTO status_history (trn_id, old_status, new_status, changed_by, notes)
      VALUES (${trnId}, NULL, ${txn.status}, ${'system@iassess.local'}, ${'Initial seed data'})
    `;

    // Insert approval steps if present
    if (txn.approvalSteps) {
      for (const step of txn.approvalSteps) {
        await sql`
          INSERT INTO online_approval_steps (trn_id, step_order, role_required, status, assessor_user_id)
          VALUES (${trnId}, ${step.step}, ${step.role}, ${step.status}, ${step.assessor})
        `;
      }
    }

    created++;
    console.log(`  [${created}/${transactions.length}] ${ref} — ${txn.status} (${txn.category})`);
  }

  // Verify
  const count = await sql`SELECT COUNT(*) as cnt FROM transactions`;
  console.log(`\n=== Done! ${count[0].cnt} transactions created. ===`);

  // Show summary
  const summary = await sql`
    SELECT status, COUNT(*) as cnt
    FROM transactions
    GROUP BY status
    ORDER BY cnt DESC
  `;
  console.log('\nStatus breakdown:');
  summary.forEach(s => console.log(`  ${s.status}: ${s.cnt}`));
}

seed().catch(e => { console.error(e); process.exit(1); });
