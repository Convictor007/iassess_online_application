import crypto from "node:crypto";

/**
 * Verifier for revision link tokens issued by the iassess_mobile assessor API.
 *
 * Token format: `<base64url(payloadJson)>.<base64url(hmacSha256(payloadJson))>`
 * — HMAC-SHA256 keyed with REVISION_TOKEN_SECRET (must match the assessor app).
 */

export function getRevisionSecret() {
  return process.env.REVISION_TOKEN_SECRET?.trim() || null;
}

export function verifyRevisionToken(token) {
  const secret = getRevisionSecret();
  if (!secret || !token || typeof token !== "string") return null;

  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = crypto
    .createHmac("sha256", secret)
    .update(body, "ascii")
    .digest("base64url");

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (typeof payload?.t !== "number" || !Number.isFinite(payload.t) || payload.t <= 0) return null;
  if (typeof payload?.r !== "string" || !payload.r) return null;
  if (!Array.isArray(payload?.i) || payload.i.length === 0) return null;
  if (typeof payload?.e !== "number" || payload.e * 1000 < Date.now()) return null;

  const items = payload.i
    .filter(
      (it) =>
        it &&
        typeof it.key === "string" &&
        typeof it.label === "string" &&
        it.key &&
        it.label
    )
    .map((it) => ({ key: it.key, label: it.label }));
  if (items.length === 0) return null;

  return { trnId: payload.t, referenceNumber: payload.r, items, expiresAt: payload.e };
}
