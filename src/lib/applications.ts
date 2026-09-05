import type { ApplicationData } from '../types';

/**
 * Matches the shape returned by getFullTransaction() in repository.mjs.
 * The API returns a flat joined object from transactions + properties + requestors + assessments.
 */
export interface ApplicationRecord {
  id: number;
  reference_number: string;
  category: string;
  submission_method: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // from assessments (nullable)
  assessment_type: string | null;
  // from properties (nullable)
  owner_name: string | null;
  title_no: string | null;
  lot_no: string | null;
  block_no: string | null;
  street_name: string | null;
  barangay: string | null;
  // from requestors (nullable)
  requestor_name: string | null;
  requestor_address: string | null;
  requestor_contact: string | null;
  requestor_email: string | null;
  purpose: string | null;
}

export async function submitApplication(data: ApplicationData): Promise<{ referenceNumber: string; error?: string }> {
  try {
    // Build documents array from uploaded blob URLs
    const documents = Object.entries(data.uploadedDocuments || {}).map(([docType, val]) => {
      if (!val) return null;
      return {
        doc_type: docType,
        file_name: val.fileName,
        file_url: val.fileUrl,
        uploaded_at: val.uploadedAt,
      };
    }).filter(Boolean);

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

    const result = await res.json();

    if (!res.ok) {
      return { referenceNumber: data.referenceNumber, error: result.error || 'Failed to submit' };
    }

    return { referenceNumber: result.referenceNumber };
  } catch (error) {
    console.error('Submit application error:', error);
    return { referenceNumber: data.referenceNumber, error: 'Network error' };
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
        documents: data.uploadedDocuments ?? {},
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
