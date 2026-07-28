import { supabase } from './supabase';
import type { ApplicationData } from '../types';

export interface ApplicationRecord {
  id: string;
  reference_number: string;
  transaction_category: string;
  assessment_type: string | null;
  certification_selections: Array<{ type: string; copies: number }>;
  owner_name: string;
  tax_declarations: string[];
  title_no: string;
  lot_no: string;
  block_no: string;
  street_name: string;
  barangay: string;
  requestor_name: string;
  requestor_address: string;
  requestor_contact: string;
  requestor_email: string;
  purpose: string;
  status: string;
  created_at: string;
}

export async function submitApplication(data: ApplicationData): Promise<{ referenceNumber: string; error?: string }> {
  const { error } = await supabase.from('applications').insert({
    reference_number: data.referenceNumber,
    transaction_category: data.transactionCategory,
    assessment_type: data.assessmentType,
    certification_selections: data.certificationSelections,
    owner_name: data.propertyInfo.ownerName,
    tax_declarations: data.propertyInfo.taxDeclarations.filter(td => td.trim()),
    title_no: data.propertyInfo.titleNo || null,
    lot_no: data.propertyInfo.lotNo || null,
    block_no: data.propertyInfo.blockNo || null,
    street_name: data.propertyInfo.streetName || null,
    barangay: data.propertyInfo.barangay,
    requestor_name: data.requestorInfo.name,
    requestor_address: data.requestorInfo.address,
    requestor_contact: data.requestorInfo.contactNumber,
    requestor_email: data.requestorInfo.email,
    purpose: data.requestorInfo.purpose,
    status: 'pending',
  });

  if (error) {
    console.error('Submit application error:', error);
    return { referenceNumber: data.referenceNumber, error: error.message };
  }

  return { referenceNumber: data.referenceNumber };
}

export async function trackApplication(referenceNumber: string): Promise<ApplicationRecord | null> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('reference_number', referenceNumber.toUpperCase().trim())
    .single();

  if (error || !data) {
    return null;
  }

  return data as ApplicationRecord;
}

export async function getApplications(): Promise<ApplicationRecord[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as ApplicationRecord[];
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
        requestorName: data.requestorInfo.name,
        requestorEmail: data.requestorInfo.email,
        propertyName: data.propertyInfo.ownerName,
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
