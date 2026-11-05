import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import { verifyRevisionToken } from "./revision-token.mjs";

const secret = "revision-token-test-secret";

function makeToken(items) {
  const body = Buffer.from(
    JSON.stringify({
      t: 73,
      r: "BAL-TEST-1234",
      i: items,
      e: Math.floor(Date.now() / 1000) + 60,
    })
  ).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(body, "ascii").digest("base64url");
  return `${body}.${signature}`;
}

test("revision token preserves the exact target document ID", () => {
  const previousSecret = process.env.REVISION_TOKEN_SECRET;
  process.env.REVISION_TOKEN_SECRET = secret;

  try {
    const token = makeToken([{ key: "tax_declaration", label: "Tax Declaration", documentId: 412 }]);
    assert.deepEqual(verifyRevisionToken(token)?.items, [
      { key: "tax_declaration", label: "Tax Declaration", documentId: 412 },
    ]);
  } finally {
    if (previousSecret === undefined) delete process.env.REVISION_TOKEN_SECRET;
    else process.env.REVISION_TOKEN_SECRET = previousSecret;
  }
});

test("revision token continues to accept older items without a document ID", () => {
  const previousSecret = process.env.REVISION_TOKEN_SECRET;
  process.env.REVISION_TOKEN_SECRET = secret;

  try {
    const token = makeToken([{ key: "tax_declaration", label: "Tax Declaration" }]);
    assert.deepEqual(verifyRevisionToken(token)?.items, [
      { key: "tax_declaration", label: "Tax Declaration" },
    ]);
  } finally {
    if (previousSecret === undefined) delete process.env.REVISION_TOKEN_SECRET;
    else process.env.REVISION_TOKEN_SECRET = previousSecret;
  }
});
