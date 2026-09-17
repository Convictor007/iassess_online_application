export const ASSESSMENT_LABELS = {
  transfer_ownership: "Transfer of Ownership (With Title)",
  transfer_handog: "Transfer of Ownership (Handog Titulo)",
  land_first_time: "Appraisal of Land Declared for the First Time",
};

export const CERTIFICATION_LABELS = {
  certified_true_copy: "Certified True Copy of Tax Declaration",
  cert_land_holdings: "Certificate of Landholdings",
};

export const REQUIREMENTS = {
  transfer_ownership: [
    "Electronic Copy of Title",
    "Document(s) - Sale, Donation, Segregation, Extra Judicial Settlement, etc. (Certified copy from ROD)",
    "Latest Tax Declaration subject for transfer (Masso)",
    "Payment of Transfer Tax (1/2 of 1% of Fair Market Value or consideration, whichever is higher - at PTO)",
    "Certificate of Tax Payment (current year and previous year - from MTO)",
    "Authenticated Xerox copy of Certificate Authorizing Registration (CAR) from BIR",
    "Special Power of Attorney (SPA) - if transacting person is not a party to the transaction",
  ],
  transfer_handog: [
    "Document(s) - Certified True Copy (Sale, Donation, Segregation, Extra Judicial Settlement, etc.)",
    "Latest Tax Declaration subject for transfer (Masso)",
    "Payment of Transfer Tax (1/2 of 1% of Fair Market Value or consideration, whichever is higher - at PTO)",
    "Certificate of Tax Payment (current year and previous year - from MTO)",
    "Electronic Copy of Title (from ROD Naga City)",
    "Special Power of Attorney (SPA) - if transacting person is not a party to the transaction",
  ],
  land_first_time: [
    "Survey Plan prepared by a licensed Geodetic Engineer, approved by LMB-DENR or Cadastral Map certified by DENR",
    "Certification from CENRO stating the land is within the alienable and disposable area",
    "Affidavit of Ownership and/or Sworn Statement declaring Market Value of Real Property",
    "Affidavit of long, continuous and notorious possession of the property",
    "Certification from the Barangay Captain that declarant is the present possessor and occupant",
    "Certification of Adjoining Owners, duly sworn by the Barangay Captain or Municipal Mayor",
    "Ocular Inspection/Investigation Report by the Assessor or authorized representative",
    "Special Power of Attorney (SPA) - if transacting person is not a party to the transaction",
  ],
  certification: [
    "Photocopy of Valid I.D. of the Owner",
    "Special Power of Attorney (SPA) from the registered owner/s or compulsory heirs - per RA 10173 (Data Privacy Act of 2012)",
    "Purpose of request must be indicated",
    "Photocopy of Valid I.D. of Requestor",
  ],
};
