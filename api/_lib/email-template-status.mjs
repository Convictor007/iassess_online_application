function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const STATUS_CONFIG = {
  under_review: {
    bannerColor: "#dbeafe",
    bannerBorder: "#93c5fd",
    iconColor: "#1d4ed8",
    icon: "&#128269;",
    title: "Documents Under Review",
    message: "Our assessment team is currently reviewing your uploaded documents. You will receive another email once the review is complete.",
    action: null,
  },
  approved: {
    bannerColor: "#dcfce7",
    bannerBorder: "#86efac",
    iconColor: "#166534",
    icon: "&#10003;",
    title: "Documents Approved",
    message: "Your uploaded documents have been verified and approved. You may now proceed to submit your original documents at the Municipal Assessor's Office.",
    action: "visit_office",
  },
  needs_revision: {
    bannerColor: "#fef3c7",
    bannerBorder: "#fcd34d",
    iconColor: "#92400e",
    icon: "&#9888;",
    title: "Documents Need Revision",
    message: "Some of your uploaded documents need to be updated or replaced. Please review the notes below and resubmit the required document(s).",
    action: "resubmit",
  },
  rejected: {
    bannerColor: "#fee2e2",
    bannerBorder: "#fca5a5",
    iconColor: "#991b1b",
    icon: "&#10007;",
    title: "Application Rejected",
    message: "We regret to inform you that your application cannot be processed. Please review the notes below for details.",
    action: null,
  },
  processing: {
    bannerColor: "#dbeafe",
    bannerBorder: "#93c5fd",
    iconColor: "#1e40af",
    icon: "&#9881;",
    title: "Application Under Processing",
    message: "Your application is now being processed. You will receive an email once your documents are ready for release.",
    action: null,
  },
  completed: {
    bannerColor: "#dcfce7",
    bannerBorder: "#86efac",
    iconColor: "#166534",
    icon: "&#10003;",
    title: "Application Completed",
    message: "Your application has been completed. Your documents are now ready for pickup at the Municipal Assessor's Office.",
    action: "pickup",
  },
};

export function buildStatusEmailHtml({ referenceNumber, requestorName, newStatus, notes }) {
  const config = STATUS_CONFIG[newStatus] || STATUS_CONFIG.under_review;

  let actionSection = "";
  if (config.action === "visit_office") {
    actionSection = `
      <div style="margin-top: 16px; padding: 14px 16px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px;">
        <div style="font-size: 13px; font-weight: 700; color: #166534; margin-bottom: 8px;">Next Steps</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 3px 0; font-size: 12px; color: #14532d; vertical-align: top; width: 18px;">1.</td>
            <td style="padding: 3px 0; font-size: 12px; color: #14532d;">Visit the <strong>Municipal Assessor's Office, Balatan, Camarines Sur</strong> (Mon-Fri, 8:00 AM - 5:00 PM).</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; font-size: 12px; color: #14532d; vertical-align: top;">2.</td>
            <td style="padding: 3px 0; font-size: 12px; color: #14532d;">Bring your <strong>original documents</strong> and present your Transaction Code.</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; font-size: 12px; color: #14532d; vertical-align: top;">3.</td>
            <td style="padding: 3px 0; font-size: 12px; color: #14532d;">The assessor will advise you on <strong>payment and processing</strong>.</td>
          </tr>
        </table>
      </div>`;
  } else if (config.action === "resubmit") {
    actionSection = `
      <div style="margin-top: 16px; padding: 14px 16px; background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 6px;">
        <div style="font-size: 13px; font-weight: 700; color: #92400e; margin-bottom: 8px;">Action Required</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 3px 0; font-size: 12px; color: #78350f; vertical-align: top; width: 18px;">1.</td>
            <td style="padding: 3px 0; font-size: 12px; color: #78350f;">Log in to the Online Application Form and track your application using your Transaction Code.</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; font-size: 12px; color: #78350f; vertical-align: top;">2.</td>
            <td style="padding: 3px 0; font-size: 12px; color: #78350f;"><strong>Resubmit</strong> the required document(s) as noted above.</td>
          </tr>
          <tr>
            <td style="padding: 3px 0; font-size: 12px; color: #78350f; vertical-align: top;">3.</td>
            <td style="padding: 3px 0; font-size: 12px; color: #78350f;">Our team will re-review your updated documents.</td>
          </tr>
        </table>
      </div>`;
  } else if (config.action === "pickup") {
    actionSection = `
      <div style="margin-top: 16px; padding: 14px 16px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px;">
        <div style="font-size: 13px; font-weight: 700; color: #166534; margin-bottom: 8px;">Ready for Pickup</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 3px 0; font-size: 12px; color: #14532d;">Your documents are ready for pickup at the <strong>Municipal Assessor's Office, Balatan, Camarines Sur</strong>.</td>
          </tr>
          <tr>
            <td style="padding: 6px 0 3px; font-size: 12px; color: #14532d;">Please bring a valid ID when claiming your documents.</td>
          </tr>
        </table>
      </div>`;
  }

  const notesSection = notes ? `
    <div style="margin-top: 14px; padding: 14px 16px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px;">
      <div style="font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 6px;">Notes from the Assessor</div>
      <div style="font-size: 12px; color: #4b5563; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(notes)}</div>
    </div>` : "";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #d1d5db;">
          <!-- Header -->
          <tr>
            <td style="background-color: #0f3b8f; padding: 10px 18px; text-align: left;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="40" valign="middle">
                    <img src="https://www.balatandrrm.org/wp-content/uploads/2025/09/cropped-balatan_logo-1.png" alt="Balatan Logo" width="36" height="36" style="display: block; border-radius: 50%;" />
                  </td>
                  <td style="padding-left: 10px;" valign="middle">
                    <div style="color: #ffffff; font-size: 14px; font-weight: 700; letter-spacing: 0.2px;">
                      ASSESSORS ONLINE APPLICATION
                    </div>
                    <div style="color: #93c5fd; font-size: 10px; margin-top: 2px;">
                      Municipality of Balatan, Camarines Sur
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Status Banner -->
          <tr>
            <td style="padding: 22px 28px 6px; text-align: center;">
              <div style="background-color: ${config.bannerColor}; border: 1px solid ${config.bannerBorder}; border-radius: 8px; padding: 14px 20px;">
                <div style="font-size: 16px; font-weight: 700; color: ${config.iconColor}; margin-bottom: 4px;">${config.icon} ${config.title}</div>
                <div style="font-size: 12px; color: ${config.iconColor};">${config.message}</div>
              </div>
            </td>
          </tr>

          <!-- Application Details -->
          <tr>
            <td style="padding: 16px 28px 6px;">
              <div style="text-align: center; font-size: 13px; color: #111827;">
                <div>Transaction Code: <strong style="font-family: monospace; font-size: 14px;">${escapeHtml(referenceNumber)}</strong></div>
                <div style="margin-top: 4px;">Requestor: <strong>${escapeHtml(requestorName)}</strong></div>
              </div>
            </td>
          </tr>

          <!-- Action Section -->
          <tr>
            <td style="padding: 12px 16px 20px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #d1d5db; border-radius: 8px;">
                <tr>
                  <td style="padding: 18px 20px;">
                    ${actionSection}
                    ${notesSection}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 16px 20px; text-align: center;">
              <p style="margin: 0; color: #6b7280; font-size: 11px;">
                This is an automated message. Please do not reply directly to this email.
              </p>
              <p style="margin: 8px 0 0; color: #6b7280; font-size: 11px;">
                For concerns, contact <a href="mailto:balatan.assessor@gmail.com" style="color: #0f3b8f; text-decoration: none;">balatan.assessor@gmail.com</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
