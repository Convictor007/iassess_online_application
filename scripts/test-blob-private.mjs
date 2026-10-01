import fs from 'node:fs';
import { put, get, list } from '@vercel/blob';

function loadEnv(file) {
  try {
    const text = fs.readFileSync(file, 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;
      let value = match[2];
      if (value.length >= 2) {
        const first = value[0];
        const last = value[value.length - 1];
        if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
          value = value.slice(1, -1);
        }
      }
      if (!(match[1] in process.env)) process.env[match[1]] = value;
    }
  } catch (err) {
    console.log(`Could not read ${file}: ${err.message}`);
  }
}

loadEnv('.env.local');
loadEnv('.env');

const token = process.env.BLOB_READ_WRITE_TOKEN || '';
console.log('token_len', token.length);
console.log('token_prefix', token.slice(0, 16));
console.log('token_suffix', token.slice(-6));
console.log('has_BLOB_STORE_ID', Boolean(process.env.BLOB_STORE_ID));
console.log('oidc_present', Boolean(process.env.VERCEL_OIDC_TOKEN));
console.log('oidc_len', (process.env.VERCEL_OIDC_TOKEN || '').length);

if (!token) {
  console.error('BLOB_READ_WRITE_TOKEN is missing');
  process.exit(1);
}

const pathname = `token-check/private-store-test-${Date.now()}.txt`;
const body = `private store connectivity check ${new Date().toISOString()}`;

try {
  const blob = await put(pathname, body, {
    access: 'private',
    contentType: 'text/plain',
  });
  console.log('PUT_OK');
  console.log('url', blob.url);
  console.log('pathname', blob.pathname);

  try {
    const publicRes = await fetch(blob.url);
    console.log('PUBLIC_FETCH_STATUS', publicRes.status);
    const publicText = await publicRes.text();
    console.log('PUBLIC_FETCH_BODY', publicText.slice(0, 120));
  } catch (err) {
    console.log('PUBLIC_FETCH_ERROR', err.message);
  }

  const got = await get(blob.pathname, { access: 'private' });
  console.log('GET_OK', {
    status: got?.statusCode,
    contentType: got?.blob?.contentType,
    pathname: got?.blob?.pathname,
  });

  if (got?.statusCode === 200 && got.stream) {
    const chunks = [];
    for await (const chunk of got.stream) chunks.push(chunk);
    console.log('GET_BODY', Buffer.concat(chunks).toString('utf8').slice(0, 120));
  }

  const listed = await list({ prefix: 'token-check/', limit: 5 });
  console.log(
    'LIST_OK',
    listed.blobs.map((b) => b.pathname),
  );
} catch (err) {
  console.error('BLOB_ERROR_NAME', err?.name);
  console.error('BLOB_ERROR_MESSAGE', err?.message);
  if (err?.cause) console.error('BLOB_ERROR_CAUSE', err.cause);
  console.error(err?.stack);
  process.exit(1);
}
