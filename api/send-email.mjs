import nodemailer from "nodemailer";

const ASSESSMENT_LABELS = {
  transfer_ownership: "Transfer of Ownership (With Title)",
  transfer_handog: "Transfer of Ownership (Handog Titulo)",
  land_first_time: "Appraisal of Land Declared for the First Time",
};

const CERT_LABELS = {
  certified_true_copy: "Certified True Copy of Tax Declaration",
  cert_land_holdings: "Certificate of Landholdings",
};

const REQUIREMENTS = {
  transfer_ownership: [
    "Electronic Copy of Title",
    "Document(s) — Sale, Donation, Segregation, Extra Judicial Settlement, etc. (Certified copy from ROD)",
    "Latest Tax Declaration subject for transfer (Masso)",
    "Payment of Transfer Tax (1/2 of 1% of Fair Market Value — at PTO)",
    "Certificate of Tax Payment (current year and previous year — from MTO)",
    "Authenticated Xerox copy of Certificate Authorizing Registration (CAR) from BIR",
    "Special Power of Attorney (SPA) — if transacting person is not a party",
  ],
  transfer_handog: [
    "Document(s) — Certified True Copy (Sale, Donation, Segregation, Extra Judicial Settlement, etc.)",
    "Latest Tax Declaration subject for transfer (Masso)",
    "Payment of Transfer Tax (1/2 of 1% of Fair Market Value — at PTO)",
    "Certificate of Tax Payment (current year and previous year — from MTO)",
    "Electronic Copy of Title (from ROD Naga City)",
    "Special Power of Attorney (SPA) — if transacting person is not a party",
  ],
  land_first_time: [
    "Survey Plan prepared by a licensed Geodetic Engineer, approved by LMB-DENR",
    "Certification from CENRO (land is within alienable and disposable area)",
    "Affidavit of Ownership and/or Sworn Statement declaring Market Value",
    "Affidavit of long, continuous and notorious possession of the property",
    "Certification from the Barangay Captain (declarant is present possessor)",
    "Certification of Adjoining Owners, sworn by Barangay Captain or Mayor",
    "Ocular Inspection/Investigation Report by the Assessor",
    "Special Power of Attorney (SPA) — if transacting person is not a party",
  ],
};

const CERT_REQUIREMENTS = [
  "Photocopy of Valid I.D. of the Owner",
  "Special Power of Attorney (SPA) from registered owner/s — per RA 10173",
  "Purpose of request must be indicated",
  "Photocopy of Valid I.D. of Requestor",
];

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = req.body;

  if (!body.referenceNumber || !body.requestorEmail || !body.requestorName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const isAssessment = body.transactionCategory === "assessment";
  const categoryLabel = isAssessment ? "Assessment Transaction" : "Certification Request";
  const typeLabel = isAssessment && body.assessmentType
    ? ASSESSMENT_LABELS[body.assessmentType] || body.assessmentType
    : "Certification Request";

  // Build requirements list
  let requirementsHtml = "";
  if (isAssessment && body.assessmentType && REQUIREMENTS[body.assessmentType]) {
    requirementsHtml = REQUIREMENTS[body.assessmentType].map((r, i) =>
      `<li style="margin-bottom: 6px; color: #374151; font-size: 13px;">${r}</li>`
    ).join("");
  } else if (!isAssessment) {
    requirementsHtml = CERT_REQUIREMENTS.map((r, i) =>
      `<li style="margin-bottom: 6px; color: #374151; font-size: 13px;">${r}</li>`
    ).join("");
  }

  // Build certificates table
  let certsHtml = "";
  if (!isAssessment && body.certificationSelections && body.certificationSelections.length > 0) {
    const certRows = body.certificationSelections.map((sel) => {
      const label = CERT_LABELS[sel.type] || sel.type;
      const fee = sel.type === "certified_true_copy" ? 50 : 50;
      const total = fee * sel.copies;
      return `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #374151;">${label}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #374151; text-align: center;">${sel.copies}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #374151; text-align: right;">₱${total.toFixed(2)}</td>
        </tr>`;
    }).join("");

    const totalAmount = body.certificationSelections.reduce((sum, sel) => {
      const fee = 50;
      return sum + fee * sel.copies;
    }, 0);

    certsHtml = `
      <tr>
        <td colspan="3" style="padding: 12px 12px 8px; background-color: #f0f9ff; border-bottom: 1px solid #e2e8f0;">
          <p style="margin: 0; color: #0369a1; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Selected Certificates</p>
        </td>
      </tr>
      <tr style="background-color: #f8fafc;">
        <td style="padding: 6px 12px; font-size: 11px; color: #64748b; font-weight: bold;">Certificate</td>
        <td style="padding: 6px 12px; font-size: 11px; color: #64748b; font-weight: bold; text-align: center;">Copies</td>
        <td style="padding: 6px 12px; font-size: 11px; color: #64748b; font-weight: bold; text-align: right;">Amount</td>
      </tr>
      ${certRows}
      <tr>
        <td colspan="2" style="padding: 10px 12px; font-size: 14px; font-weight: bold; color: #1a3c6e; border-top: 2px solid #1a3c6e;">Total</td>
        <td style="padding: 10px 12px; font-size: 14px; font-weight: bold; color: #1a3c6e; text-align: right; border-top: 2px solid #1a3c6e;">₱${totalAmount.toFixed(2)}</td>
      </tr>`;
  }

  // Build property details
  const taxDecList = (body.taxDeclarations || []).filter(t => t).map(t => `<li>${t}</li>`).join("");

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a3c6e 0%, #0072D2 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: bold;">Municipality of Balatan</h1>
              <p style="margin: 5px 0 0; color: #93c5fd; font-size: 13px;">Office of the Municipal Assessor</p>
            </td>
          </tr>

          <!-- Success Banner -->
          <tr>
            <td style="padding: 30px 30px 15px; text-align: center;">
              <div style="width: 60px; height: 60px; background-color: #dcfce7; border-radius: 50%; margin: 0 auto 15px; line-height: 60px; font-size: 30px;">&#10003;</div>
              <h2 style="margin: 0; color: #166534; font-size: 20px;">Application Received!</h2>
              <p style="margin: 8px 0 0; color: #6b7280; font-size: 14px;">Your application has been successfully submitted.</p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">Dear <strong>${body.requestorName}</strong>,</p>
              <p style="margin: 10px 0 0; color: #374151; font-size: 14px; line-height: 1.6;">Thank you for submitting your application. Below are your complete application details:</p>
            </td>
          </tr>

          <!-- Transaction Code -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <div style="background: linear-gradient(135deg, #1a3c6e, #0072D2); border-radius: 8px; padding: 20px; text-align: center;">
                <p style="margin: 0; color: #93c5fd; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Your Transaction Code</p>
                <p style="margin: 8px 0 0; color: #ffffff; font-size: 28px; font-weight: bold; font-family: monospace; letter-spacing: 3px;">${body.referenceNumber}</p>
                <p style="margin: 8px 0 0; color: #93c5fd; font-size: 11px;">Save this code — you'll need it to track your application and when visiting our office.</p>
              </div>
            </td>
          </tr>

          <!-- Application Details -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td colspan="2" style="padding: 12px; background-color: #eff6ff; border-bottom: 1px solid #e2e8f0;">
                    <p style="margin: 0; color: #1e40af; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Transaction Details</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; width: 40%; color: #64748b; font-size: 12px;">Service Type</td>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 13px; font-weight: bold;">${categoryLabel}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px;">Service Classification</td>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 13px;">${typeLabel}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px;">Date Submitted</td>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 13px;">${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; color: #64748b; font-size: 12px;">Status</td>
                  <td style="padding: 10px 12px;"><span style="background-color: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold;">PENDING</span></td>
                </tr>
              </table>
            </td>
          </tr>

          ${certsHtml ? `
          <!-- Certificates -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                ${certsHtml}
              </table>
            </td>
          </tr>` : ""}

          <!-- Property Info -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td colspan="2" style="padding: 12px; background-color: #f0fdf4; border-bottom: 1px solid #e2e8f0;">
                    <p style="margin: 0; color: #166534; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Property Information</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; width: 40%; color: #64748b; font-size: 12px;">Owner's Name</td>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 13px; font-weight: bold;">${body.propertyName}</td>
                </tr>
                ${taxDecList ? `
                <tr>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px; vertical-align: top;">Tax Declaration No.</td>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 13px;"><ul style="margin: 0; padding-left: 16px;">${taxDecList}</ul></td>
                </tr>` : ""}
                ${body.titleNo ? `
                <tr>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px;">Title No.</td>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 13px;">${body.titleNo}</td>
                </tr>` : ""}
                <tr>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px;">Lot / Block / Street</td>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 13px;">${[body.lotNo, body.blockNo, body.streetName].filter(Boolean).join(", ") || "-"}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; color: #64748b; font-size: 12px;">Barangay</td>
                  <td style="padding: 10px 12px; color: #1e293b; font-size: 13px;">${body.barangay}, Balatan, Camarines Sur</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Requestor Info -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td colspan="2" style="padding: 12px; background-color: #fefce8; border-bottom: 1px solid #e2e8f0;">
                    <p style="margin: 0; color: #854d0e; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Requestor's Information</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; width: 40%; color: #64748b; font-size: 12px;">Name</td>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 13px;">${body.requestorName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px;">Address</td>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 13px;">${body.requestorAddress || "-"}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px;">Contact Number</td>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 13px;">${body.requestorContact || "-"}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 12px;">Email</td>
                  <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 13px;">${body.requestorEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 12px; color: #64748b; font-size: 12px; vertical-align: top;">Purpose</td>
                  <td style="padding: 10px 12px; color: #1e293b; font-size: 13px;">${body.purpose || "-"}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Requirements -->
          ${requirementsHtml ? `
          <tr>
            <td style="padding: 0 30px 20px;">
              <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="padding: 12px; background-color: #fef2f2; border-bottom: 1px solid #e2e8f0;">
                  <p style="margin: 0; color: #991b1b; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Documents to Bring on Your Appointment</p>
                </div>
                <div style="padding: 12px;">
                  <ol style="margin: 0; padding-left: 20px;">${requirementsHtml}</ol>
                </div>
              </div>
            </td>
          </tr>` : ""}

          <!-- Important Notice -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px;">
                <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.6;">
                  <strong>Important:</strong> Assessment Transactions are accepted on <strong>Tuesday and Thursday</strong> only. Please bring all required documents on your scheduled appointment date. Walk-in clients not on schedule will not be entertained.
                </p>
              </div>
            </td>
          </tr>

          <!-- Next Steps -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <h3 style="margin: 0 0 10px; color: #1e293b; font-size: 15px;">What Happens Next?</h3>
              <ol style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 13px; line-height: 1.8;">
                <li>Your application will be reviewed by our office</li>
                <li>You will receive an email with your appointment date</li>
                <li>Visit our office on your scheduled date with the required documents</li>
              </ol>
            </td>
          </tr>

          <!-- Contact -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                If you have any questions, please contact us at
                <a href="mailto:balatan.assessor@gmail.com" style="color: #0072D2; text-decoration: none;">balatan.assessor@gmail.com</a>
                or visit the Municipal Hall, Balatan, Camarines Sur.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">This is an automated message. Please do not reply directly to this email.</p>
              <p style="margin: 8px 0 0; color: #9ca3af; font-size: 11px;">&copy; ${new Date().getFullYear()} Municipal Government of Balatan &mdash; Management Information Systems Office</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || "Assessor's Office"}" <${process.env.SMTP_USER}>`,
      to: body.requestorEmail,
      subject: `Application Received — ${body.referenceNumber} | ${categoryLabel}`,
      html: html,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Email error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
