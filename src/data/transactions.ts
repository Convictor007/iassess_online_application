import type { CertificateItem, AssessmentType, TransactionCategory } from '../types';
import type { DocumentGuide } from '../components/DocumentGuideModal';

export const CERTIFICATES: CertificateItem[] = [
  { id: 'certified_true_copy', label: 'Certified True Copy of Tax Declaration', fee: 75 },
  { id: 'cert_land_holdings', label: 'Certificate of Landholdings', fee: 75 },
];

export const BARANGAYS = [
  'Cabanbanan',
  'Cabungan',
  'Camangahan',
  'Cayogcog',
  'Coguit',
  'Duran',
  'Laganac',
  'Luluasan',
  'Montenegro',
  'Pararao',
  'Pulang Daga',
  'Sagrada Nacacale',
  'San Francisco',
  'Santiago Nacacale',
  'Siramag',
  'Tapayas',
  'Tomatarayo',
];

export const ASSESSMENT_LABELS: Record<AssessmentType, string> = {
  transfer_ownership: 'Transfer of Ownership (With Title)',
  transfer_handog: 'Transfer of Ownership (Handog Titulo)',
  land_first_time: 'Appraisal of Land Declared for the First Time',
};

export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  assessment: 'Assessment Transaction',
  certification: 'Certification Request',
};

// Based on Citizen Charter — requirements include where to get each document
export const REQUIREMENTS: Record<AssessmentType, { copies: number; label: string; whereToGet: string; guide?: string }[]> = {
  transfer_ownership: [
    { copies: 1, label: 'Electronic Copy of Title', whereToGet: 'Registry of Deeds (ROD) — Naga City', guide: 'Request a certified true copy of the title. Bring a valid ID and pay the certification fee. Fee: ₱20-₱50 per page. Processing: 1-3 working days.' },
    { copies: 3, label: 'Document(s) — Sale, Donation, Segregation, Extra Judicial Settlement, etc. (Certified copy from ROD)', whereToGet: 'Registry of Deeds (ROD) — Naga City', guide: 'Request a certified true copy of the deed. Ensure the document is annotated and registered. Fee: ₱20-₱50 per page. Processing: 1-3 working days.' },
    { copies: 3, label: 'Latest Tax Declaration subject for transfer', whereToGet: 'Municipal Assessor\'s Office (MASO) — Balatan', guide: 'Request from the Municipal Hall of Balatan. Ask for the latest tax declaration under the seller\'s name. Fee: Free. Processing: Same day.' },
    { copies: 3, label: 'Payment of Transfer Tax (½ of 1% of Fair Market Value or consideration, whichever is higher)', whereToGet: 'Provincial Treasurer\'s Office (PTO) — Pili, Camarines Sur', guide: 'Pay at the Provincial Capitol Compound. Amount = 0.5% × higher of (FMV or sale price). Bring tax declaration and deed of sale. Fee: 0.5% of FMV. Processing: Same day.' },
    { copies: 3, label: 'Certificate of Tax Payment (current year and previous year)', whereToGet: 'Municipal Treasurer\'s Office (MTO) — Balatan', guide: 'Request from the Municipal Hall of Balatan. Ensure all previous years\' taxes are fully paid. Fee: Minimal. Processing: Same day.' },
    { copies: 3, label: 'Authenticated Xerox copy of Certificate Authorizing Registration (CAR) from BIR', whereToGet: 'Bureau of Internal Revenue (BIR) — Naga City', guide: 'File for CAR after paying Capital Gains Tax (6% of sale price). Processing: 5-10 working days. Start this early — it\'s the most time-consuming document.' },
    { copies: 1, label: 'Special Power of Attorney (SPA) — if transacting person is not a party to the transaction', whereToGet: 'Notary Public — Balatan, Nabua, or Iriga City', guide: 'Have the SPA prepared and notarized. Must specifically authorize the representative to process the transfer at the Municipal Assessor\'s Office. Fee: ₱100-₱300. Processing: Same day.' },
  ],
  transfer_handog: [
    { copies: 3, label: 'Document(s) — Certified True Copy (Sale, Donation, Segregation, Extra Judicial Settlement, etc.)', whereToGet: 'Registry of Deeds (ROD) — Naga City', guide: 'Request a certified true copy of the deed. For Handog Titulo (DENR-issued), ensure the document is properly registered. Fee: ₱20-₱50 per page.' },
    { copies: 3, label: 'Latest Tax Declaration subject for transfer', whereToGet: 'Municipal Assessor\'s Office (MASO) — Balatan', guide: 'Request from the Municipal Hall of Balatan. Fee: Free. Processing: Same day.' },
    { copies: 3, label: 'Payment of Transfer Tax (½ of 1% of Fair Market Value or consideration, whichever is higher)', whereToGet: 'Provincial Treasurer\'s Office (PTO) — Pili, Camarines Sur', guide: 'Pay at the Provincial Capitol Compound. Fee: 0.5% of FMV. Processing: Same day.' },
    { copies: 3, label: 'Certificate of Tax Payment (current year and previous year)', whereToGet: 'Municipal Treasurer\'s Office (MTO) — Balatan', guide: 'Request from the Municipal Hall of Balatan. Fee: Minimal. Processing: Same day.' },
    { copies: 1, label: 'Electronic Copy of Title (ROD Naga City)', whereToGet: 'Registry of Deeds (ROD) — Naga City', guide: 'Request the electronic copy of the DENR-issued title (Handog Titulo). Fee: ₱20-₱50 per page. Processing: 1-3 working days.' },
    { copies: 1, label: 'Special Power of Attorney (SPA) — if transacting person is not a party to the transaction', whereToGet: 'Notary Public — Balatan, Nabua, or Iriga City', guide: 'Have the SPA prepared and notarized. Fee: ₱100-₱300. Processing: Same day.' },
  ],
  land_first_time: [
    { copies: 1, label: 'Survey Plan prepared by a licensed Geodetic Engineer, approved by LMB-DENR or Cadastral Map certified by DENR', whereToGet: 'Licensed Geodetic Engineer + DENR-LMB', guide: 'Hire a licensed Geodetic Engineer. Submit to DENR for approval. Fee: ₱5,000-₱15,000 (varies by lot size). Processing: 2-4 weeks.' },
    { copies: 1, label: 'Certification from CENRO stating the land is within the alienable and disposable area', whereToGet: 'CENRO — Iriga City', guide: 'Bring the survey plan and proof of possession. Processing: 3-7 working days.' },
    { copies: 1, label: 'Affidavit of Ownership and/or Sworn Statement declaring Market Value of Real Property', whereToGet: 'Notary Public — Balatan, Nabua, or Iriga City', guide: 'Prepare and have it notarized. Fee: ₱100-₱300. Processing: Same day.' },
    { copies: 1, label: 'Affidavit of long, continuous and notorious possession of the property', whereToGet: 'Notary Public — Balatan, Nabua, or Iriga City', guide: 'Prepare and have it notarized. Fee: ₱100-₱300. Processing: Same day.' },
    { copies: 1, label: 'Certification from the Barangay Captain that declarant is the present possessor and occupant', whereToGet: 'Barangay Hall — where the property is located', guide: 'Request from the Barangay Captain. Fee: Minimal. Processing: 1-3 days.' },
    { copies: 1, label: 'Certification of Adjoining Owners, duly sworn by the Barangay Captain or Municipal Mayor', whereToGet: 'Barangay Hall or Municipal Hall — Balatan', guide: 'Get certifications from adjacent lot owners. Have these sworn before the Barangay Captain or Municipal Mayor. Fee: Minimal. Processing: 1-3 days.' },
    { copies: 1, label: 'Ocular Inspection/Investigation Report by the Assessor or authorized representative', whereToGet: 'Municipal Assessor\'s Office (MASO) — Balatan', guide: 'This is conducted AFTER your application is filed. An assessor will visit the property. Fee: None. Processing: 1-2 weeks after filing.' },
    { copies: 1, label: 'Special Power of Attorney (SPA) — if transacting person is not a party to the transaction', whereToGet: 'Notary Public — Balatan, Nabua, or Iriga City', guide: 'Have the SPA prepared and notarized. Fee: ₱100-₱300. Processing: Same day.' },
  ],
};

export const CERT_REQUIREMENTS: { copies: number; label: string; whereToGet: string; guide?: string }[] = [
  { copies: 1, label: 'Photocopy of Valid I.D. of the Owner', whereToGet: 'Self-prepared (photocopy shop)', guide: 'Any valid government-issued ID (Passport, Driver\'s License, PhilSys ID, SSS ID, etc.). Fee: ₱1-₱5.' },
  { copies: 1, label: 'Special Power of Attorney (SPA) from the registered owner/s or compulsory heirs — per RA 10173 (Data Privacy Act of 2012)', whereToGet: 'Notary Public — Balatan, Nabua, or Iriga City', guide: 'Required under RA 10173. Must authorize the requestor to obtain copies of the Tax Declaration. Fee: ₱100-₱300. Processing: Same day.' },
  { copies: 1, label: 'Purpose of request must be indicated', whereToGet: 'Self-prepared', guide: 'Write the purpose (e.g., "for bank loan", "for insurance", "for personal records"). Include in the application form.' },
  { copies: 1, label: 'Photocopy of Valid I.D. of Requestor', whereToGet: 'Self-prepared (photocopy shop)', guide: 'Separate from the owner\'s ID. Even if you are the owner, you need your own ID photocopy. Fee: ₱1-₱5.' },
];

// Step-by-step guides for the citizen charter process
export const CITIZEN_CHARTER_PROCESS = {
  transfer_ownership: {
    title: 'Transfer of Ownership — Walk-in Process',
    steps: [
      { step: 1, client: 'Submit requirements to Personnel in charge', agency: 'Receives and reviews document and requirements', time: '15-30 minutes', responsible: 'Jovito I. Cuarto (Mun. Assessor), Francisco M. Pacer (Admin. Aide IV), Edith N. Cuarto (Admin. Aide IV)' },
      { step: 2, client: 'Wait for the prescribed period until you receive the FAAS/TD', agency: 'Prepare and sign FAAS/TD; submit to Provincial Assessor for approval', time: '15-30 minutes + 15 working days (provincial approval)', responsible: 'Jovito I. Cuarto (Mun. Assessor), Provincial Assessor' },
      { step: 3, client: 'Receive approved FAAS/TD', agency: 'Release approved FAAS/TD', time: '5 minutes', responsible: 'Jovito I. Cuarto (Mun. Assessor), Francisco M. Pacer (Admin. Aide IV), Edith N. Cuarto (Admin. Aide IV)' },
    ],
    totalProcessingTime: '15 working days',
    fee: 'NONE',
  },
  transfer_handog: {
    title: 'Transfer of Ownership (Handog Titulo) — Walk-in Process',
    steps: [
      { step: 1, client: 'Submit requirements to Personnel in charge', agency: 'Receives and reviews document and requirements', time: '15-30 minutes', responsible: 'Jovito I. Cuarto (Mun. Assessor), Francisco M. Pacer (Admin. Aide IV), Edith N. Cuarto (Admin. Aide IV)' },
      { step: 2, client: 'Wait for the prescribed period until you receive the FAAS/TD', agency: 'Prepare and sign FAAS/TD; submit to Provincial Assessor for approval', time: '15-30 minutes + 15 working days (provincial approval)', responsible: 'Jovito I. Cuarto (Mun. Assessor), Provincial Assessor' },
      { step: 3, client: 'Receive approved FAAS/TD', agency: 'Release approved FAAS/TD', time: '5 minutes', responsible: 'Jovito I. Cuarto (Mun. Assessor), Francisco M. Pacer (Admin. Aide IV), Edith N. Cuarto (Admin. Aide IV)' },
    ],
    totalProcessingTime: '15 working days',
    fee: 'NONE',
  },
  land_first_time: {
    title: 'Appraisal of Land (First Time) — Walk-in Process',
    steps: [
      { step: 1, client: 'Submit requirements to Personnel in charge', agency: 'Receives and reviews document and requirement', time: '15-30 minutes', responsible: 'Jovito I. Cuarto (Mun. Assessor), Francisco M. Pacer (Admin. Aide IV), Edith N. Cuarto (Admin. Aide IV)' },
      { step: 2, client: 'Wait for the prescribed period until you receive the FAAS/TD', agency: 'Prepare and sign FAAS/TD; submit to Provincial Assessor for approval', time: '15-30 minutes + 15 working days (provincial approval)', responsible: 'Jovito I. Cuarto (Mun. Assessor), Provincial Assessor' },
      { step: 3, client: 'Receive approved FAAS/TD', agency: 'Release approved FAAS/TD', time: '5 minutes', responsible: 'Jovito I. Cuarto (Mun. Assessor), Francisco M. Pacer (Admin. Aide IV), Edith N. Cuarto (Admin. Aide IV)' },
    ],
    totalProcessingTime: '16 working days',
    fee: 'NONE',
  },
};

// Detailed step-by-step guides for each document
export const DOCUMENT_GUIDES: Record<string, DocumentGuide> = {
  'Electronic Copy of Title': {
    title: 'How to Get Electronic Copy of Title',
    office: 'Registry of Deeds (ROD) — Camarines Sur',
    location: 'Naga City Hall Complex, Panicuason, Naga City, Camarines Sur (approx. 30 km from Balatan)',
    whatToBring: [
      'Valid Government-issued ID (original + photocopy)',
      'Owner\'s birth certificate or any government ID',
      'Lot number and title number (if known)',
      'Payment for certification fee (varies per page)',
    ],
    steps: [
      { step: 'Go to the Registry of Deeds', details: 'Proceed to the Registry of Deeds of Camarines Sur located at the Naga City Hall Complex. It is near the Provincial Capitol.' },
      { step: 'Fill out the request form', details: 'At the ROD, fill out the request form for a Certified True Copy of Title. Indicate the lot number, title number, and the registered owner\'s name.' },
      { step: 'Submit the form and pay', details: 'Submit the form at the receiving window along with your valid ID. Pay the certification fee at the cashier. Fees are typically around ₱20-₱50 per page.' },
      { step: 'Wait for processing', details: 'Processing usually takes 1-3 working days. You may opt for rush processing for an additional fee.' },
      { step: 'Claim the document', details: 'Return to the ROD with your claim stub and valid ID to claim the certified true copy of the title.' },
    ],
    fees: '₱20-₱50 per page',
    processingTime: '1-3 working days (rush available)',
    tips: 'Bring the lot number and owner\'s complete name to speed up the search. If you don\'t know the title number, the ROD can search by lot number or owner name.',
  },

  'Document(s) — Sale, Donation, Segregation, Extra Judicial Settlement, etc. (Certified copy from ROD)': {
    title: 'How to Get Certified True Copy of Deed',
    office: 'Registry of Deeds (ROD) — Camarines Sur',
    location: 'Naga City Hall Complex, Panicuason, Naga City, Camarines Sur',
    whatToBring: [
      'Valid Government-issued ID (original + photocopy)',
      'Document details: document number, page number, book number, series year',
      'Names of parties involved in the transaction',
      'Payment for certification fee',
    ],
    steps: [
      { step: 'Go to the Registry of Deeds', details: 'Proceed to the ROD of Camarines Sur at the Naga City Hall Complex.' },
      { step: 'Fill out the request form', details: 'Request a Certified True Copy of the deed (Deed of Sale, Donation, Extra Judicial Settlement, etc.). Provide the document number, book number, page number, and series year if available.' },
      { step: 'Submit and pay', details: 'Submit the form with your valid ID. Pay the certification fee at the cashier.' },
      { step: 'Wait for processing', details: 'Processing takes 1-3 working days. Rush processing may be available for an additional fee.' },
      { step: 'Claim the document', details: 'Return with your claim stub and valid ID to claim the certified true copy.' },
    ],
    fees: '₱20-₱50 per page',
    processingTime: '1-3 working days',
    tips: 'If you don\'t have the document details, bring the Tax Declaration number and the owner\'s name — the ROD can search their records.',
  },

  'Latest Tax Declaration subject for transfer': {
    title: 'How to Get Latest Tax Declaration',
    office: 'Municipal Assessor\'s Office (MASO) — Balatan',
    location: 'Municipal Hall of Balatan, Poblacion (Siramag), Balatan, Camarines Sur',
    whatToBring: [
      'Valid Government-issued ID',
      'Property owner\'s complete name',
      'Tax Declaration number (if available)',
      'Lot number and barangay location',
    ],
    steps: [
      { step: 'Go to the Municipal Assessor\'s Office', details: 'Proceed to the MASO at the Municipal Hall of Balatan. Ask for the window handling Tax Declarations.' },
      { step: 'Request the Tax Declaration', details: 'Inform the staff that you need the latest Tax Declaration for a property transfer. Provide the owner\'s name, lot number, and barangay.' },
      { step: 'Wait for retrieval', details: 'The staff will retrieve the Tax Declaration from their records. This usually takes a few minutes to an hour depending on their workload.' },
      { step: 'Receive the document', details: 'Verify the details on the Tax Declaration (owner name, lot number, area, assessed value). Request 3 copies for transfer purposes.' },
    ],
    fees: 'Free (certified true copy may have a small fee)',
    processingTime: 'Same day',
    tips: 'Go early in the morning to avoid long queues. The MASO is open Monday to Friday, 8:00 AM to 5:00 PM.',
  },

  'Payment of Transfer Tax (½ of 1% of Fair Market Value or consideration, whichever is higher)': {
    title: 'How to Pay Transfer Tax',
    office: 'Provincial Treasurer\'s Office (PTO) — Camarines Sur',
    location: 'Provincial Capitol Compound, Pili, Camarines Sur (approx. 25 km from Balatan)',
    whatToBring: [
      'Certified True Copy of Tax Declaration',
      'Deed of Sale or equivalent document',
      'Valid Government-issued ID',
      'Calculator (optional, for computing the amount)',
    ],
    steps: [
      { step: 'Compute the Transfer Tax', details: 'Transfer Tax = 0.5% × higher of (Fair Market Value or Sale Consideration). For example, if FMV is ₱500,000 and sale price is ₱600,000, Transfer Tax = 0.5% × ₱600,000 = ₱3,000.' },
      { step: 'Go to the Provincial Treasurer\'s Office', details: 'Proceed to the PTO at the Provincial Capitol Compound in Pili, Camarines Sur.' },
      { step: 'Fill out the payment form', details: 'Fill out the Real Property Tax payment form. Indicate the property details, FMV, and computed transfer tax.' },
      { step: 'Submit and pay', details: 'Submit the form with the Tax Declaration and Deed of Sale. Pay the transfer tax at the cashier.' },
      { step: 'Receive the Official Receipt', details: 'Keep the Official Receipt (OR) — this is your proof of payment. You will need this for the next steps.' },
    ],
    fees: '0.5% of Fair Market Value or Sale Price (whichever is higher)',
    processingTime: 'Same day',
    tips: 'Compute the transfer tax before going to save time. If the FMV from the Tax Declaration is outdated, the assessor may require a new valuation.',
  },

  'Certificate of Tax Payment (current year and previous year)': {
    title: 'How to Get Certificate of Tax Payment',
    office: 'Municipal Treasurer\'s Office (MTO) — Balatan',
    location: 'Municipal Hall of Balatan, Poblacion (Siramag), Balatan, Camarines Sur',
    whatToBring: [
      'Tax Declaration of the property',
      'Valid Government-issued ID',
      'Proof of previous tax payments (if available)',
    ],
    steps: [
      { step: 'Go to the Municipal Treasurer\'s Office', details: 'Proceed to the MTO at the Municipal Hall of Balatan. Ask for the window handling Real Property Tax certificates.' },
      { step: 'Request the certificate', details: 'Request a Certificate of Tax Payment for both the current year and the previous year. Provide the Tax Declaration and property details.' },
      { step: 'Pay any outstanding balance', details: 'If there are unpaid taxes, settle them first before the certificate can be issued.' },
      { step: 'Receive the certificates', details: 'Get both certificates (current year and previous year). Ensure they are signed and stamped by the Treasurer.' },
    ],
    fees: 'Minimal certification fee (varies)',
    processingTime: 'Same day',
    tips: 'Make sure all previous years\' taxes are fully paid. Any outstanding balance will delay the issuance of the certificate.',
  },

  'Authenticated Xerox copy of Certificate Authorizing Registration (CAR) from BIR': {
    title: 'How to Get Certificate Authorizing Registration (CAR)',
    office: 'Bureau of Internal Revenue (BIR) — Naga City',
    location: 'BIR Revenue District Office No. 63, Naga City, Camarines Sur',
    whatToBring: [
      'Deed of Sale or Transfer document',
      'Tax Declaration of the property',
      'Capital Gains Tax return (BIR Form 1706) and proof of payment',
      'Valid Government-issued IDs of buyer and seller',
      'Community Tax Certificate (CTC) of buyer and seller',
      'Certificate of No Property Improvement (if applicable)',
    ],
    steps: [
      { step: 'Pay Capital Gains Tax first', details: 'Before filing for CAR, you must first pay the Capital Gains Tax (6% of sale price or FMV, whichever is higher) at an Authorized Agent Bank (AAB). File BIR Form 1706.' },
      { step: 'Go to BIR Naga City', details: 'Proceed to the BIR Revenue District Office No. 63 in Naga City with all your documents.' },
      { step: 'Fill out the CAR application', details: 'Fill out the application form for Certificate Authorizing Registration. Attach all required documents including the proof of Capital Gains Tax payment.' },
      { step: 'Submit at the Receiving Window', details: 'Submit all documents at the receiving window. The BIR will review and process your application.' },
      { step: 'Wait for CAR issuance', details: 'Processing typically takes 5-10 working days. The BIR will notify you when the CAR is ready.' },
      { step: 'Claim the CAR', details: 'Return to BIR with your claim stub and valid ID. Request an authenticated copy — you need 3 copies for the transfer.' },
    ],
    fees: 'Capital Gains Tax: 6% of sale price or FMV (whichever is higher) + certification fees',
    processingTime: '5-10 working days',
    tips: 'File and pay Capital Gains Tax within 30 days from the date of sale to avoid penalties. The CAR is one of the most time-consuming documents to obtain — start this early.',
  },

  'Special Power of Attorney (SPA) — if transacting person is not a party to the transaction': {
    title: 'How to Prepare a Special Power of Attorney (SPA)',
    office: 'Any Notary Public — Balatan or nearby municipalities',
    location: 'Notary Public offices in Balatan, Nabua, or Iriga City',
    whatToBring: [
      'Valid Government-issued IDs of the principal (owner) and attorney-in-fact (representative)',
      'Complete names and addresses of both parties',
      'Details of the property (lot number, title number, location)',
      'Purpose of the SPA (specifically: to process transfer of ownership at the Municipal Assessor\'s Office)',
    ],
    steps: [
      { step: 'Prepare the SPA document', details: 'Draft the SPA or have a lawyer prepare it. The SPA must specifically authorize the attorney-in-fact to process the transfer of ownership of the property at the Municipal Assessor\'s Office of Balatan.' },
      { step: 'Go to a Notary Public', details: 'Bring the SPA document along with the valid IDs of both the principal and attorney-in-fact to a Notary Public.' },
      { step: 'Sign in the presence of the Notary', details: 'The principal (owner) must sign the SPA in the presence of the Notary Public. Both parties may need to appear personally.' },
      { step: 'Receive the notarized SPA', details: 'The Notary Public will stamp and sign the document. Keep the original — you will submit it to the Assessor\'s Office.' },
    ],
    fees: 'Notarial fee varies (typically ₱100-₱300)',
    processingTime: 'Same day',
    tips: 'The SPA must specifically mention the authority to process transfer of ownership. A general SPA may not be accepted. If the owner is abroad, the SPA must be authenticated by the Philippine Embassy.',
  },

  // --- LAND FIRST TIME DOCUMENTS ---

  'Survey Plan prepared by a licensed Geodetic Engineer, approved by LMB-DENR or Cadastral Map certified by DENR': {
    title: 'How to Get a Survey Plan',
    office: 'Licensed Geodetic Engineer + DENR-LMB',
    location: 'Hire locally or through the DENR Regional Office, Legazpi City or Naga City',
    whatToBring: [
      'Property location details (barangay, lot boundaries)',
      'Names of adjoining lot owners',
      'Any existing property documents or previous surveys',
    ],
    steps: [
      { step: 'Hire a Licensed Geodetic Engineer', details: 'Contact a licensed Geodetic Engineer in your area. Ask for a quotation for a boundary survey of your property.' },
      { step: 'Schedule the survey', details: 'Agree on a schedule. The Geodetic Engineer will visit the property to conduct the survey using GPS and other surveying instruments.' },
      { step: 'Wait for the survey plan', details: 'The Geodetic Engineer will prepare the survey plan based on the field data. This usually takes 1-2 weeks.' },
      { step: 'Submit to DENR-LMB for approval', details: 'Submit the survey plan to the Land Management Bureau (LMB) of DENR for approval. The DENR Regional Office in Legazpi City or the CENRO in Iriga City can process this.' },
      { step: 'Receive the approved survey plan', details: 'Once approved, the DENR will stamp and sign the survey plan. You need 1 copy for your application.' },
    ],
    fees: 'Survey: ₱5,000-₱15,000 (varies by lot size) + DENR processing fees',
    processingTime: '2-4 weeks total',
    tips: 'Ask the Geodetic Engineer if they can also handle the DENR submission. Some offer complete packages. Check if your lot is covered by an existing cadastral survey — if so, you can request a Cadastral Map instead of a new survey.',
  },

  'Certification from CENRO stating the land is within the alienable and disposable area': {
    title: 'How to Get CENRO Certification',
    office: 'Community Environment and Natural Resources Office (CENRO)',
    location: 'CENRO Iriga, Iriga City, Camarines Sur (approx. 20 km from Balatan)',
    whatToBring: [
      'Approved Survey Plan or Cadastral Map',
      'Valid Government-issued ID',
      'Application letter stating the purpose',
      'Lot description and location',
    ],
    steps: [
      { step: 'Go to CENRO Iriga', details: 'Proceed to the Community Environment and Natural Resources Office (CENRO) in Iriga City. It is located along the national highway.' },
      { step: 'Fill out the application form', details: 'Request for a Certification that the land is within the Alienable and Disposable (A&D) area. Fill out the application form provided.' },
      { step: 'Submit requirements', details: 'Submit the application form, survey plan, valid ID, and application letter. The CENRO staff will verify the land status in their records.' },
      { step: 'Wait for processing', details: 'Processing may take 3-7 working days as the CENRO needs to verify the land classification from their records.' },
      { step: 'Claim the certification', details: 'Return to CENRO with your claim stub and valid ID to claim the certification.' },
    ],
    fees: 'Minimal processing fee',
    processingTime: '3-7 working days',
    tips: 'Call ahead to confirm the requirements and schedule. Bring extra copies of your survey plan in case they need one for their file.',
  },

  'Affidavit of Ownership and/or Sworn Statement declaring Market Value of Real Property': {
    title: 'How to Prepare Affidavit of Ownership',
    office: 'Any Notary Public — Balatan or nearby',
    location: 'Notary Public offices in Balatan, Nabua, or Iriga City',
    whatToBring: [
      'Valid Government-issued ID',
      'Property details (lot number, location, area)',
      'Market value of the property',
      'Draft of the affidavit (or have a lawyer prepare it)',
    ],
    steps: [
      { step: 'Draft the Affidavit', details: 'Prepare the affidavit stating: (1) you are the owner of the property, (2) declare the market value, (3) describe the property (lot number, location, area, boundaries).' },
      { step: 'Go to a Notary Public', details: 'Bring the draft affidavit and your valid ID to a Notary Public.' },
      { step: 'Sign in the presence of the Notary', details: 'Sign the affidavit in the presence of the Notary Public. The notary will verify your identity.' },
      { step: 'Receive the notarized affidavit', details: 'The Notary Public will stamp and sign the document. Keep the original for your application.' },
    ],
    fees: 'Notarial fee (typically ₱100-₱300)',
    processingTime: 'Same day',
    tips: 'You can find affidavit templates online or ask the Notary Public to draft it for you. Be accurate with the market value — this will be used for tax assessment.',
  },

  'Affidavit of long, continuous and notorious possession of the property': {
    title: 'How to Prepare Affidavit of Possession',
    office: 'Any Notary Public — Balatan or nearby',
    location: 'Notary Public offices in Balatan, Nabua, or Iriga City',
    whatToBring: [
      'Valid Government-issued ID',
      'Property details (lot number, location, area)',
      'Duration of possession (how many years)',
      'Any proof of possession (photos, receipts, witness statements)',
    ],
    steps: [
      { step: 'Draft the Affidavit', details: 'Prepare the affidavit stating: (1) you have been in long, continuous, and notorious possession of the property, (2) specify the duration, (3) describe how you have occupied and used the land.' },
      { step: 'Go to a Notary Public', details: 'Bring the draft affidavit and your valid ID to a Notary Public.' },
      { step: 'Sign in the presence of the Notary', details: 'Sign the affidavit in the presence of the Notary Public.' },
      { step: 'Receive the notarized affidavit', details: 'The Notary Public will stamp and sign the document.' },
    ],
    fees: 'Notarial fee (typically ₱100-₱300)',
    processingTime: 'Same day',
    tips: 'Be specific about the duration of possession. If you inherited the property, mention how long your family has been occupying it. Photos of the property can strengthen your claim.',
  },

  'Certification from the Barangay Captain that declarant is the present possessor and occupant': {
    title: 'How to Get Barangay Certification of Possession',
    office: 'Barangay Hall — where the property is located',
    location: 'Barangay Hall of the barangay where the property is located in Balatan',
    whatToBring: [
      'Valid Government-issued ID',
      'Property location and lot number',
      'Proof of residency in the barangay (if applicable)',
    ],
    steps: [
      { step: 'Go to the Barangay Hall', details: 'Proceed to the Barangay Hall where the property is located. Ask for the Barangay Captain or the Barangay Secretary.' },
      { step: 'Request the certification', details: 'Request a certification stating that you are the present possessor and occupant of the land. Provide the lot number and property location.' },
      { step: 'Wait for processing', details: 'The Barangay Captain may need to verify with barangay records or conduct a visual inspection. This usually takes 1-3 days.' },
      { step: 'Claim the certification', details: 'Return to claim the signed and stamped certification from the Barangay Captain.' },
    ],
    fees: 'Minimal fee (varies by barangay)',
    processingTime: '1-3 days',
    tips: 'Bring a barangay Kagawad or witness who can confirm your possession of the property. This can speed up the process.',
  },

  'Certification of Adjoining Owners, duly sworn by the Barangay Captain or Municipal Mayor': {
    title: 'How to Get Adjoining Owners Certification',
    office: 'Barangay Hall or Municipal Hall',
    location: 'Barangay Hall of the property\'s barangay, or Municipal Hall of Balatan',
    whatToBring: [
      'Valid Government-issued ID',
      'Property location and lot number',
      'Names and addresses of adjoining lot owners',
      'The adjoining owners (or their representatives)',
    ],
    steps: [
      { step: 'Identify adjoining lot owners', details: 'Determine who owns the lots adjacent to your property. You can check the Tax Declarations or ask the Barangay Captain.' },
      { step: 'Have the owners sign the certification', details: 'Each adjoining owner must sign a certification confirming they are the owners of the adjacent lots and identifying the boundaries.' },
      { step: 'Go to the Barangay Captain or Mayor', details: 'Bring the signed certifications to the Barangay Captain or Municipal Mayor for notarization/swearing.' },
      { step: 'Receive the sworn certification', details: 'The Barangay Captain or Mayor will swear the certifications and stamp them.' },
    ],
    fees: 'Minimal fee',
    processingTime: '1-3 days',
    tips: 'Coordinate with the adjoining owners in advance. If an owner is unavailable, a representative with a SPA may sign on their behalf.',
  },

  'Ocular Inspection/Investigation Report by the Assessor or authorized representative': {
    title: 'Ocular Inspection by the Assessor',
    office: 'Municipal Assessor\'s Office (MASO) — Balatan',
    location: 'Municipal Hall of Balatan, Poblacion (Siramag), Balatan, Camarines Sur',
    whatToBring: [
      'All submitted documents (for reference)',
      'Access to the property',
    ],
    steps: [
      { step: 'File your complete application', details: 'Submit all your requirements to the Municipal Assessor\'s Office. The ocular inspection is conducted AFTER your application is filed.' },
      { step: 'Wait for scheduling', details: 'The Assessor\'s Office will schedule an inspection visit. They will notify you of the date.' },
      { step: 'Accompany the Assessor', details: 'Be present during the inspection. The Assessor or their representative will visit the property to verify its actual condition, boundaries, and improvements.' },
      { step: 'Receive the report', details: 'The Assessor will prepare an Investigation Report based on their findings. This is part of the assessment process.' },
    ],
    fees: 'None',
    processingTime: 'Scheduled after filing (1-2 weeks)',
    tips: 'This is not something you need to obtain beforehand — it is conducted by the Assessor\'s Office as part of processing your application. Just ensure you are available on the scheduled date.',
  },

  // --- CERTIFICATION DOCUMENTS ---

  'Photocopy of Valid I.D. of the Owner': {
    title: 'How to Prepare Owner\'s ID Photocopy',
    office: 'Any photocopying shop or at home',
    location: 'Any photocopying shop in Balatan or nearby',
    whatToBring: [
      'Valid Government-issued ID of the property owner',
      'Photocopier access',
    ],
    steps: [
      { step: 'Get a valid government-issued ID', details: 'Any of the following: Passport, Driver\'s License, PhilSys ID, SSS ID, GSIS ID, PRC ID, Postal ID, Voter\'s ID, or any other government-issued ID with photo.' },
      { step: 'Make a photocopy', details: 'Photocopy the front (and back if applicable) of the ID. Use clear, legible photocopy.' },
      { step: 'Verify clarity', details: 'Ensure the name, photo, and ID number are clearly visible on the photocopy.' },
    ],
    fees: '₱1-₱5 per page',
    processingTime: 'Same day',
    tips: 'Bring the original ID as well — some offices may ask to verify it.',
  },

  'Special Power of Attorney (SPA) from the registered owner/s or compulsory heirs — per RA 10173 (Data Privacy Act of 2012)': {
    title: 'How to Prepare SPA for Certification Request',
    office: 'Any Notary Public — Balatan or nearby',
    location: 'Notary Public offices in Balatan, Nabua, or Iriga City',
    whatToBring: [
      'Valid Government-issued IDs of owner and representative',
      'Complete names and addresses',
      'Property details (for identification)',
      'Purpose: to request Certified True Copy of Tax Declaration / Certificate of Landholdings',
    ],
    steps: [
      { step: 'Draft the SPA', details: 'Prepare the SPA specifically authorizing the representative to request Certified True Copies of Tax Declaration and/or Certificate of Landholdings from the Municipal Assessor\'s Office of Balatan. Per RA 10173 (Data Privacy Act of 2012), this is required.' },
      { step: 'Go to a Notary Public', details: 'Bring the SPA and valid IDs of both parties to a Notary Public.' },
      { step: 'Sign and notarize', details: 'The owner signs the SPA in the presence of the Notary.' },
      { step: 'Receive the notarized SPA', details: 'Keep the original — submit it with your application.' },
    ],
    fees: 'Notarial fee (typically ₱100-₱300)',
    processingTime: 'Same day',
    tips: 'Under RA 10173, the Municipal Assessor\'s Office is required to ask for an SPA from the registered owner before releasing any copies of the Tax Declaration. This is non-negotiable.',
  },

  'Purpose of request must be indicated': {
    title: 'How to Write the Purpose of Request',
    office: 'N/A — self-prepared',
    location: 'N/A',
    whatToBring: [
      'Knowledge of why you need the document',
    ],
    steps: [
      { step: 'Determine the purpose', details: 'Common purposes include: bank loan/mortgage, insurance claim, personal records, legal proceedings, property verification, or any other official use.' },
      { step: 'Write a brief statement', details: 'Write a clear and concise statement, e.g., "For bank loan processing", "For insurance claim", "For personal records and file", or "For legal proceedings before the courts of Balatan".' },
      { step: 'Include in your application', details: 'Write this purpose in the application form or in a separate letter of request addressed to the Municipal Assessor.' },
    ],
    fees: 'None',
    processingTime: 'Same day',
    tips: 'Be specific but concise. If for a bank loan, mention the bank name. If for legal proceedings, mention the case number if available.',
  },

  'Photocopy of Valid I.D. of Requestor': {
    title: 'How to Prepare Requestor\'s ID Photocopy',
    office: 'Any photocopying shop',
    location: 'Any photocopying shop in Balatan or nearby',
    whatToBring: [
      'Valid Government-issued ID of the person transacting',
      'Photocopier access',
    ],
    steps: [
      { step: 'Get a valid government-issued ID', details: 'Any government-issued ID with photo of the person transacting (may be different from the owner if using SPA).' },
      { step: 'Make a photocopy', details: 'Photocopy the front (and back if applicable) clearly.' },
      { step: 'Verify clarity', details: 'Ensure the name, photo, and ID number are clearly visible.' },
    ],
    fees: '₱1-₱5 per page',
    processingTime: 'Same day',
    tips: 'The requestor\'s ID is separate from the owner\'s ID. If you are the owner transacting for yourself, you still need to provide your own ID photocopy.',
  },
};

export function generateReferenceNumber(): string {
  const prefix = 'BAL';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}
