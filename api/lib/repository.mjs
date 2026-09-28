import { getSql } from './db.mjs';

// ─── Create ─────────────────────────────────────────────────────────────────

/**
 * Insert a full transaction with all related data.
 * @param {Object} input - CreateTransactionInput
 * @returns {Promise<string>} transaction id
 */
export async function createTransaction(input) {
  const sql = getSql();
  const now = new Date().toISOString();

  // 1) Core transaction
  const [txn] = await sql`
    INSERT INTO transactions (reference_number, category, submission_method, status, created_at, updated_at)
    VALUES (${input.reference_number}, ${input.category}, ${input.submission_method || null}, 'pending', ${now}, ${now})
    RETURNING id
  `;
  const transactionId = txn.id;

  // 2) Assessment (if applicable)
  if (input.assessment_type) {
    await sql`
      INSERT INTO assessments (trn_id, assessment_type)
      VALUES (${transactionId}, ${input.assessment_type})
    `;
  }

  // 3) Certifications (if any)
  if (input.certifications && input.certifications.length > 0) {
    for (const cert of input.certifications) {
      await sql`
        INSERT INTO certifications (trn_id, cert_type, copies, fee)
        VALUES (${transactionId}, ${cert.cert_type}, ${cert.copies}, ${cert.fee})
      `;
    }
  }

  // 4) Property
  await sql`
    INSERT INTO properties (trn_id, owner_name, title_no, lot_no, block_no, street_name, barangay)
    VALUES (
      ${transactionId},
      ${input.property.owner_name},
      ${input.property.title_no || null},
      ${input.property.lot_no || null},
      ${input.property.block_no || null},
      ${input.property.street_name || null},
      ${input.property.barangay}
    )
  `;

  // 5) Tax declarations (if any)
  if (input.property.tax_declarations && input.property.tax_declarations.length > 0) {
    for (const td of input.property.tax_declarations) {
      if (td && td.trim()) {
        await sql`
          INSERT INTO tax_declarations (trn_id, td_number)
          VALUES (${transactionId}, ${td})
        `;
      }
    }
  }

  // 6) Requestor
  await sql`
    INSERT INTO requestors (trn_id, name, address, contact_number, email, purpose)
    VALUES (
      ${transactionId},
      ${input.requestor.name},
      ${input.requestor.address},
      ${input.requestor.contact_number},
      ${input.requestor.email},
      ${input.requestor.purpose}
    )
  `;

  // 7) Documents (if any)
  if (input.documents && input.documents.length > 0) {
    for (const doc of input.documents) {
      await sql`
        INSERT INTO documents (trn_id, doc_type, file_name, file_url, blob_pathname, mime_type, file_size)
        VALUES (${transactionId}, ${doc.doc_type}, ${doc.file_name}, ${doc.file_url}, ${doc.blob_pathname || null}, ${doc.mime_type || null}, ${doc.file_size || null})
      `;
    }
  }

  // 8) Initial status history
  await sql`
    INSERT INTO status_history (trn_id, old_status, new_status, changed_by, notes)
    VALUES (${transactionId}, null, 'pending', 'system', 'Application submitted')
  `;

  return transactionId;
}

// ─── Read ───────────────────────────────────────────────────────────────────

/**
 * Get full transaction with all related data.
 * @param {string} referenceNumber
 * @returns {Promise<Object|null>}
 */
export async function getFullTransaction(referenceNumber) {
  const sql = getSql();

  const rows = await sql`
    SELECT
      t.id, t.reference_number, t.category, t.submission_method, t.status,
      t.notes, t.created_at, t.updated_at,
      a.assessment_type,
      p.owner_name, p.title_no, p.lot_no, p.block_no, p.street_name, p.barangay,
      r.name AS requestor_name, r.address AS requestor_address,
      r.contact_number AS requestor_contact, r.email AS requestor_email,
      r.purpose
    FROM transactions t
    LEFT JOIN assessments a ON a.trn_id = t.id
    LEFT JOIN properties p ON p.trn_id = t.id
    LEFT JOIN requestors r ON r.trn_id = t.id
    WHERE t.reference_number = ${referenceNumber.toUpperCase().trim()}
    LIMIT 1
  `;

  if (!rows[0]) return null;

  const txn = rows[0];

  // Fetch documents separately (1:N)
  const docs = await sql`
    SELECT id, doc_type, file_name, file_url, blob_pathname, mime_type, file_size, uploaded_at
    FROM documents WHERE trn_id = ${txn.id} ORDER BY uploaded_at
  `;

  return { ...txn, documents: docs };
}

/**
 * Get transaction by ID.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getTransactionById(id) {
  const sql = getSql();

  const rows = await sql`
    SELECT
      t.id, t.reference_number, t.category, t.submission_method, t.status,
      t.notes, t.created_at, t.updated_at,
      a.assessment_type,
      p.owner_name, p.title_no, p.lot_no, p.block_no, p.street_name, p.barangay,
      r.name AS requestor_name, r.address AS requestor_address,
      r.contact_number AS requestor_contact, r.email AS requestor_email,
      r.purpose
    FROM transactions t
    LEFT JOIN assessments a ON a.trn_id = t.id
    LEFT JOIN properties p ON p.trn_id = t.id
    LEFT JOIN requestors r ON r.trn_id = t.id
    WHERE t.id = ${id}
    LIMIT 1
  `;

  if (!rows[0]) return null;

  const txn = rows[0];
  const docs = await sql`
    SELECT id, doc_type, file_name, file_url, blob_pathname, mime_type, file_size, uploaded_at
    FROM documents WHERE trn_id = ${txn.id} ORDER BY uploaded_at
  `;

  return { ...txn, documents: docs };
}

/**
 * List transactions with summary data.
 * @param {Object} opts - { status, search, category }
 * @returns {Promise<Array>}
 */
export async function listTransactions(opts = {}) {
  const sql = getSql();
  const { status, search, category } = opts;

  const hasStatus = status && status !== 'all';
  const hasSearch = !!search;
  const hasCategory = category && category !== 'all';

  if (hasStatus && hasSearch && hasCategory) {
    const term = `%${search}%`;
    return sql`
      SELECT
        t.id, t.reference_number, t.category, t.status,
        p.owner_name, p.barangay,
        r.name AS requestor_name,
        t.created_at,
        (SELECT COUNT(*) FROM documents d WHERE d.trn_id = t.id) AS document_count,
        (SELECT COUNT(*) FROM certifications c WHERE c.trn_id = t.id) AS certification_count
      FROM transactions t
      LEFT JOIN properties p ON p.trn_id = t.id
      LEFT JOIN requestors r ON r.trn_id = t.id
      WHERE t.status = ${status}
        AND t.category = ${category}
        AND (t.reference_number ILIKE ${term} OR p.owner_name ILIKE ${term} OR r.name ILIKE ${term})
      ORDER BY t.created_at DESC
    `;
  }

  if (hasStatus && hasSearch) {
    const term = `%${search}%`;
    return sql`
      SELECT
        t.id, t.reference_number, t.category, t.status,
        p.owner_name, p.barangay,
        r.name AS requestor_name,
        t.created_at,
        (SELECT COUNT(*) FROM documents d WHERE d.trn_id = t.id) AS document_count,
        (SELECT COUNT(*) FROM certifications c WHERE c.trn_id = t.id) AS certification_count
      FROM transactions t
      LEFT JOIN properties p ON p.trn_id = t.id
      LEFT JOIN requestors r ON r.trn_id = t.id
      WHERE t.status = ${status}
        AND (t.reference_number ILIKE ${term} OR p.owner_name ILIKE ${term} OR r.name ILIKE ${term})
      ORDER BY t.created_at DESC
    `;
  }

  if (hasStatus && hasCategory) {
    return sql`
      SELECT
        t.id, t.reference_number, t.category, t.status,
        p.owner_name, p.barangay,
        r.name AS requestor_name,
        t.created_at,
        (SELECT COUNT(*) FROM documents d WHERE d.trn_id = t.id) AS document_count,
        (SELECT COUNT(*) FROM certifications c WHERE c.trn_id = t.id) AS certification_count
      FROM transactions t
      LEFT JOIN properties p ON p.trn_id = t.id
      LEFT JOIN requestors r ON r.trn_id = t.id
      WHERE t.status = ${status}
        AND t.category = ${category}
      ORDER BY t.created_at DESC
    `;
  }

  if (hasSearch) {
    const term = `%${search}%`;
    return sql`
      SELECT
        t.id, t.reference_number, t.category, t.status,
        p.owner_name, p.barangay,
        r.name AS requestor_name,
        t.created_at,
        (SELECT COUNT(*) FROM documents d WHERE d.trn_id = t.id) AS document_count,
        (SELECT COUNT(*) FROM certifications c WHERE c.trn_id = t.id) AS certification_count
      FROM transactions t
      LEFT JOIN properties p ON p.trn_id = t.id
      LEFT JOIN requestors r ON r.trn_id = t.id
      WHERE t.reference_number ILIKE ${term}
        OR p.owner_name ILIKE ${term}
        OR r.name ILIKE ${term}
      ORDER BY t.created_at DESC
    `;
  }

  if (hasCategory) {
    return sql`
      SELECT
        t.id, t.reference_number, t.category, t.status,
        p.owner_name, p.barangay,
        r.name AS requestor_name,
        t.created_at,
        (SELECT COUNT(*) FROM documents d WHERE d.trn_id = t.id) AS document_count,
        (SELECT COUNT(*) FROM certifications c WHERE c.trn_id = t.id) AS certification_count
      FROM transactions t
      LEFT JOIN properties p ON p.trn_id = t.id
      LEFT JOIN requestors r ON r.trn_id = t.id
      WHERE t.category = ${category}
      ORDER BY t.created_at DESC
    `;
  }

  return sql`
    SELECT
      t.id, t.reference_number, t.category, t.status,
      p.owner_name, p.barangay,
      r.name AS requestor_name,
      t.created_at,
      (SELECT COUNT(*) FROM documents d WHERE d.trn_id = t.id) AS document_count,
      (SELECT COUNT(*) FROM certifications c WHERE c.trn_id = t.id) AS certification_count
    FROM transactions t
    LEFT JOIN properties p ON p.trn_id = t.id
    LEFT JOIN requestors r ON r.trn_id = t.id
    ORDER BY t.created_at DESC
  `;
}

/**
 * Get certifications for a transaction.
 * @param {string} transactionId
 * @returns {Promise<Array>}
 */
export async function getCertifications(transactionId) {
  const sql = getSql();
  return sql`
    SELECT * FROM certifications
    WHERE trn_id = ${transactionId}
    ORDER BY cert_type
  `;
}

/**
 * Get documents for a transaction.
 * @param {string} transactionId
 * @returns {Promise<Array>}
 */
export async function getDocuments(transactionId) {
  const sql = getSql();
  return sql`
    SELECT * FROM documents
    WHERE trn_id = ${transactionId}
    ORDER BY uploaded_at
  `;
}

/**
 * Get tax declarations for a transaction.
 * @param {string} transactionId
 * @returns {Promise<Array>}
 */
export async function getTaxDeclarations(transactionId) {
  const sql = getSql();
  return sql`
    SELECT * FROM tax_declarations
    WHERE trn_id = ${transactionId}
  `;
}

/**
 * Get status history for a transaction.
 * @param {string} transactionId
 * @returns {Promise<Array>}
 */
export async function getStatusHistory(transactionId) {
  const sql = getSql();
  return sql`
    SELECT * FROM status_history
    WHERE trn_id = ${transactionId}
    ORDER BY changed_at
  `;
}

// ─── Update ─────────────────────────────────────────────────────────────────

/**
 * Update transaction status.
 * @param {string} transactionId
 * @param {string} newStatus
 * @param {string} [changedBy]
 * @param {string} [notes]
 * @returns {Promise<boolean>}
 */
export async function updateTransactionStatus(transactionId, newStatus, changedBy, notes) {
  const sql = getSql();
  const now = new Date().toISOString();

  const [current] = await sql`
    SELECT status FROM transactions WHERE id = ${transactionId} LIMIT 1
  `;

  if (!current) return false;

  const oldStatus = current.status;

  await sql`
    UPDATE transactions
    SET status = ${newStatus}, updated_at = ${now}
    WHERE id = ${transactionId}
  `;

  await sql`
    INSERT INTO status_history (trn_id, old_status, new_status, changed_by, notes)
    VALUES (${transactionId}, ${oldStatus}, ${newStatus}, ${changedBy || 'system'}, ${notes || null})
  `;

  return true;
}

// ─── Delete ─────────────────────────────────────────────────────────────────

/**
 * Delete a transaction and all related data (cascade).
 * @param {string} transactionId
 * @returns {Promise<boolean>}
 */
export async function deleteTransaction(transactionId) {
  const sql = getSql();
  const rows = await sql`
    DELETE FROM transactions WHERE id = ${transactionId} RETURNING id
  `;
  return rows.length > 0;
}
