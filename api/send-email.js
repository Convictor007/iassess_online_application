import nodemailer from "nodemailer";

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

  const {
    referenceNumber,
    transactionCategory,
    assessmentType,
    requestorName,
    requestorEmail,
    propertyName,
    barangay,
  } = req.body;

  if (!referenceNumber || !requestorEmail || !requestorName) {
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

  const categoryLabel = transactionCategory === "assessment" ? "Assessment" : "Certification";
  const typeLabel = assessmentType
    ? assessmentType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Certification Request";

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
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: bold;">
                Municipality of Balatan
              </h1>
              <p style="margin: 5px 0 0; color: #93c5fd; font-size: 13px;">
                Office of the Municipal Assessor
              </p>
            </td>
          </tr>

          <!-- Success Banner -->
          <tr>
            <td style="padding: 30px 30px 15px; text-align: center;">
              <div style="width: 60px; height: 60px; background-color: #dcfce7; border-radius: 50%; margin: 0 auto 15px; line-height: 60px; font-size: 30px;">
                &#10003;
              </div>
              <h2 style="margin: 0; color: #166534; font-size: 20px;">Application Received!</h2>
              <p style="margin: 8px 0 0; color: #6b7280; font-size: 14px;">
                Your application has been successfully submitted.
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">
                Dear <strong>${requestorName}</strong>,
              </p>
              <p style="margin: 10px 0 0; color: #374151; font-size: 14px; line-height: 1.6;">
                Thank you for submitting your application to the Municipal Assessor's Office. Below are your application details:
              </p>
            </td>
          </tr>

          <!-- Details Card -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <tr>
                  <td style="padding: 15px; border-bottom: 1px solid #e2e8f0;">
                    <p style="margin: 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Transaction Code</p>
                    <p style="margin: 5px 0 0; color: #1a3c6e; font-size: 22px; font-weight: bold; font-family: monospace; letter-spacing: 2px;">${referenceNumber}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px; border-bottom: 1px solid #e2e8f0;">
                    <p style="margin: 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Transaction Type</p>
                    <p style="margin: 5px 0 0; color: #1e293b; font-size: 14px; font-weight: bold;">${categoryLabel} &mdash; ${typeLabel}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px; border-bottom: 1px solid #e2e8f0;">
                    <p style="margin: 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Property Owner</p>
                    <p style="margin: 5px 0 0; color: #1e293b; font-size: 14px;">${propertyName}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px;">
                    <p style="margin: 0; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Location</p>
                    <p style="margin: 5px 0 0; color: #1e293b; font-size: 14px;">Barangay ${barangay}, Balatan, Camarines Sur</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Instructions -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px;">
                <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.6;">
                  <strong>Important:</strong> Please save your Transaction Code. You will need it to track your application status and when visiting our office.
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
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                This is an automated message. Please do not reply directly to this email.
              </p>
              <p style="margin: 8px 0 0; color: #9ca3af; font-size: 11px;">
                &copy; ${new Date().getFullYear()} Municipal Government of Balatan &mdash; Management Information Systems Office
              </p>
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
      to: requestorEmail,
      subject: `Application Received - ${referenceNumber}`,
      html: html,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Email error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
