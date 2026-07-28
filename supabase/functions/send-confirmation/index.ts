import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
  referenceNumber: string;
  transactionCategory: string;
  assessmentType: string | null;
  requestorName: string;
  requestorEmail: string;
  propertyName: string;
  barangay: string;
}

function buildEmailHtml(payload: EmailPayload): string {
  const categoryLabel = payload.transactionCategory === "assessment" ? "Assessment" : "Certification";
  const typeLabel = payload.assessmentType
    ? payload.assessmentType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Certification Request";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #1a3c6e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 18px;">Municipal Assessor's Office</h1>
    <p style="margin: 5px 0 0; font-size: 12px; opacity: 0.8;">Municipality of Balatan, Camarines Sur</p>
  </div>

  <div style="background-color: #f8f9fa; padding: 20px; border: 1px solid #e9ecef;">
    <h2 style="color: #1a3c6e; font-size: 16px;">Application Received</h2>

    <p>Dear <strong>${payload.requestorName}</strong>,</p>

    <p>Your application has been successfully submitted. Below are your application details:</p>

    <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
      <tr style="background-color: #e9ecef;">
        <td style="padding: 10px; font-weight: bold; border: 1px solid #dee2e6;">Transaction Code</td>
        <td style="padding: 10px; font-family: monospace; font-size: 16px; border: 1px solid #dee2e6;">${payload.referenceNumber}</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; border: 1px solid #dee2e6;">Transaction Type</td>
        <td style="padding: 10px; border: 1px solid #dee2e6;">${categoryLabel} - ${typeLabel}</td>
      </tr>
      <tr style="background-color: #e9ecef;">
        <td style="padding: 10px; font-weight: bold; border: 1px solid #dee2e6;">Property Owner</td>
        <td style="padding: 10px; border: 1px solid #dee2e6;">${payload.propertyName}</td>
      </tr>
      <tr>
        <td style="padding: 10px; font-weight: bold; border: 1px solid #dee2e6;">Location</td>
        <td style="padding: 10px; border: 1px solid #dee2e6;">${payload.barangay}</td>
      </tr>
    </table>

    <p><strong>Important:</strong> Please save your transaction code. You will need it to track your application status and when visiting our office.</p>

    <p>If you have any questions, please contact us at balatan.assessor@gmail.com or visit the Municipal Hall, Balatan, Camarines Sur.</p>

    <p>Thank you for using the Assessor's Online Application Form.</p>
  </div>

  <div style="text-align: center; padding: 15px; color: #6c757d; font-size: 11px;">
    <p>This is an automated message. Please do not reply directly to this email.</p>
    <p>&copy; ${new Date().getFullYear()} Municipal Government of Balatan</p>
  </div>
</body>
</html>`;
}

async function sendViaResend(to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY");

  if (!apiKey) {
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Assessor's Office <onboarding@resend.dev>",
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: `Resend error: ${err}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: EmailPayload = await req.json();

    if (!payload.referenceNumber || !payload.requestorEmail || !payload.requestorName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const subject = `Application Received - ${payload.referenceNumber}`;
    const html = buildEmailHtml(payload);

    const result = await sendViaResend(payload.requestorEmail, subject, html);

    if (!result.success) {
      console.error("Email failed:", result.error);
      // Return success anyway - submission is more important than email
      return new Response(
        JSON.stringify({ success: true, emailQueued: false, error: result.error }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, emailQueued: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
