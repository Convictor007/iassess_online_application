export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    // Check env vars
    const dbUrl = process.env.DATABASE_URL;
    const maskedUrl = dbUrl ? dbUrl.substring(0, 30) + "..." : "NOT SET";

    // Try to import and use repository
    const repo = await import("./lib/repository.mjs");
    const { getSql } = await import("./lib/db.mjs");

    let dbStatus = "unknown";
    try {
      const sql = getSql();
      const result = await sql`SELECT 1 as test`;
      dbStatus = result[0]?.test === 1 ? "connected" : "error";
    } catch (e) {
      dbStatus = `error: ${e.message}`;
    }

    return res.status(200).json({
      status: "ok",
      database_url: maskedUrl,
      db_status: dbStatus,
      repository_functions: Object.keys(repo),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      error: err.message,
      stack: err.stack?.split("\n").slice(0, 3),
    });
  }
}
