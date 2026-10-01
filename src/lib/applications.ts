import type { ApplicationData } from '../types';

/**
 * Matches the shape returned by getFullTransaction() in repository.mjs.
 */
export interface ApplicationRecord {
  id: number;
  reference_number: string;
  category: string;
  submission_method: string | null;
  status: string;
  notes: string | null;
  review_notes: string | null;
  appointment_date: string | null;
  appointment_expires_at: string | null;
  created_at: string;
  updated_at: string;
  assessment_type: string | null;
  owner_name: string | null;
  title_no: string | null;
  lot_no: string | null;
  block_no: string | null;
  street_name: string | null;
  barangay: string | null;
  requestor_name: string | null;
  requestor_address: string | null;
  requestor_contact: string | null;
  requestor_email: string | null;
  purpose: string | null;
  documents?: Array<{
    id: number;
    doc_type: string;
    file_name: string;
    file_url: string;
    blob_pathname?: string | null;
    mime_type: string | null;
    uploaded_at: string;
  }>;
  document_reviews?: Array<{
    doc_type: string;
    status: string;
    notes: string | null;
    reviewed_at: string | null;
  }>;
}

async function readJsonResponse(res: Response): Promise<{ ok: boolean; status: number; data: any }> {
  const text = await res.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text.slice(0, 300) };
    }
  }
  return { ok: res.ok, status: res.status, data };
}

export async function submitApplication(data: ApplicationData): Promise<{ referenceNumber: string; error?: string }> {
  try {
    const documents = Object.entries(data.uploadedDocuments || {}).flatMap(([docType, files]) => {
      if (!files || !Array.isArray(files)) return [];
      return files.map((f) => ({
        doc_type: docType,
        file_name: f.fileName,
        file_url: f.fileUrl,
        blob_pathname: f.pathname || null,
        uploaded_at: f.uploadedAt,
      }));
    });

    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referenceNumber: data.referenceNumber,
        transactionCategory: data.transactionCategory,
        assessmentType: data.assessmentType,
        certificationSelections: data.certificationSelections,
        submissionMethod: data.submissionMethod,
        ownerName: data.propertyInfo.ownerName,
        taxDeclarations: data.propertyInfo.taxDeclarations.filter(td => td.trim()),
        titleNo: data.propertyInfo.titleNo || null,
        lotNo: data.propertyInfo.lotNo || null,
        blockNo: data.propertyInfo.blockNo || null,
        streetName: data.propertyInfo.streetName || null,
        barangay: data.propertyInfo.barangay,
        requestorName: data.requestorInfo.name,
        requestorAddress: data.requestorInfo.address,
        requestorContact: data.requestorInfo.contactNumber,
        requestorEmail: data.requestorInfo.email,
        purpose: data.requestorInfo.purpose,
        documents,
      }),
    });

    const { ok, status, data: result } = await readJsonResponse(res);

    if (!ok) {
      return {
        referenceNumber: data.referenceNumber,
        error: result?.detail || result?.error || `Failed to submit (HTTP ${status})`,
      };
    }

    return { referenceNumber: result?.referenceNumber || data.referenceNumber };
  } catch (error) {
    console.error('Submit application error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return {
      referenceNumber: data.referenceNumber,
      error: `Network error: ${message}. If you are on localhost, restart vite so /api is proxied to the backend.`,
    };
  }
}

export async function trackApplication(referenceNumber: string): Promise<ApplicationRecord | null> {
  try {
    const apiKey = import.meta.env.VITE_MOBILE_API_KEY || '';
    const res = await fetch(`/api/applications?reference_number=${encodeURIComponent(referenceNumber)}`, {
      headers: { 'x-api-key': apiKey },
    });

    if (!res.ok) return null;

    const result = await res.json();
    return result.data as ApplicationRecord;
  } catch {
    return null;
  }
}

export async function getApplications(): Promise<ApplicationRecord[]> {
  try {
    const apiKey = import.meta.env.VITE_MOBILE_API_KEY || '';
    const res = await fetch('/api/applications', {
      headers: { 'x-api-key': apiKey },
    });

    if (!res.ok) return [];

    const result = await res.json();
    return result.data as ApplicationRecord[];
  } catch {
    return [];
  }
}

export async function sendConfirmationEmail(data: ApplicationData): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referenceNumber: data.referenceNumber,
        transactionCategory: data.transactionCategory,
        assessmentType: data.assessmentType,
        certificationSelections: data.certificationSelections,
        submissionMethod: data.submissionMethod,
        requestorName: data.requestorInfo.name,
        requestorEmail: data.requestorInfo.email,
        requestorContact: data.requestorInfo.contactNumber,
        requestorAddress: data.requestorInfo.address,
        purpose: data.requestorInfo.purpose,
        propertyName: data.propertyInfo.ownerName,
        taxDeclarations: data.propertyInfo.taxDeclarations.filter(td => td.trim()),
        titleNo: data.propertyInfo.titleNo,
        lotNo: data.propertyInfo.lotNo,
        blockNo: data.propertyInfo.blockNo,
        streetName: data.propertyInfo.streetName,
        barangay: data.propertyInfo.barangay,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      return { success: false, error: result.error || 'Failed to send email' };
    }

    return { success: true };
  } catch (error) {
    console.error('Send email error:', error);
    return { success: false, error: 'Network error' };
  }
}
