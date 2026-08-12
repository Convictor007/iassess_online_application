import { createClient } from "@supabase/supabase-js";

const MOBILE_API_KEY = process.env.MOBILE_API_KEY;

function getClient(useAdmin = false) {
  const url = process.env.VITE_SUPABASE_URL;
  const key = useAdmin ? process.env.SUPABASE_SECRET_KEY : process.env.VITE_SUPABASE_ANON_KEY;
  return createClient(url, key);
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PATCH, OPTIONS");
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

  if (req.method === "GET") {
    try {
      const { status, search } = req.query;

      let query = getClient()
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      if (search) {
        const term = `%${search}%`;
        query = query.or(
          `reference_number.ilike.${term},owner_name.ilike.${term},requestor_name.ilike.${term},barangay.ilike.${term}`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error("Supabase query error:", error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true, data: data || [] });
    } catch (err) {
      console.error("GET /api/applications error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  if (req.method === "PATCH") {
    const body = req.body;
    if (!body) {
      return res.status(400).json({ error: "No body provided" });
    }
    const { id, status } = body;

    if (!id || !status) {
      return res.status(400).json({ error: "id and status are required" });
    }

    const validStatuses = ["pending", "processing", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const { data, error } = await getClient(true)
      .from("applications")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message, code: error.code });
    }

    return res.status(200).json({ success: true, data });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
