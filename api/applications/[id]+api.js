import { getSql } from "../lib/db.mjs";

const MOBILE_API_KEY = process.env.MOBILE_API_KEY;

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");
}

function verifyAuth(req) {
  const key = req.headers["x-api-key"];
  if (!MOBILE_API_KEY || key !== MOBILE_API_KEY) {
    return false;
  }
  return true;
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (!verifyAuth(req)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "id is required" });
    }

    const sql = getSql();
    const rows = await sql`
      SELECT * FROM applications
      WHERE id = ${id}
      LIMIT 1
    `;

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "Application not found" });
    }

    return res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error("GET /api/applications/:id error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
