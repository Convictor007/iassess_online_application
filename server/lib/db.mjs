import { neon } from "@neondatabase/serverless";
import pg from "pg";

let sql;
let pool;

function requireUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return url;
}

/** Local Postgres when DB_DRIVER=pg or host is localhost/127.0.0.1. */
export function shouldUseLocalPg(url = process.env.DATABASE_URL || "") {
  const driver = (process.env.DB_DRIVER || "").trim().toLowerCase();
  if (driver === "pg" || driver === "postgres" || driver === "local") return true;
  if (driver === "neon" || driver === "serverless") return false;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

function getPool() {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: requireUrl(),
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

function toParameterized(strings, values) {
  if (typeof strings === "string") {
    return { text: strings, params: values };
  }
  let text = strings[0] ?? "";
  for (let i = 0; i < values.length; i++) {
    text += `$${i + 1}${strings[i + 1] ?? ""}`;
  }
  return { text, params: values };
}

async function runPg(strings, values) {
  const { text, params } = toParameterized(strings, values);
  const result = await getPool().query(text, params);
  return result.rows;
}

function wrapLocal() {
  const fn = async (strings, ...values) => runPg(strings, values);
  fn.query = async (text, params = []) => runPg(text, params);
  return fn;
}

function wrapNeon(url) {
  const neonSql = neon(url);
  const fn = async (strings, ...values) => neonSql(strings, ...values);
  fn.query = async (text, params = []) => neonSql.query(text, params);
  return fn;
}

export function getSql() {
  if (!sql) {
    const url = requireUrl();
    sql = shouldUseLocalPg(url) ? wrapLocal() : wrapNeon(url);
  }
  return sql;
}
