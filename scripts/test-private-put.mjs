/**
 * Local equivalent of api/upload.js put() with private access.
 * Proves the private store token works when access is 'private'.
 */
import { put, get } from '@vercel/blob';
import fs from 'node:fs';

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
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
const applicationId = 'BAL-LOCAL-PUT-' + Date.now();
const pathname = `${applicationId}/valid_id-${Date.now()}-pixel.png`;

console.log('token_prefix', token.slice(0, 20));
console.log('store_id', process.env.BLOB_STORE_ID || null);
console.log('pathname', pathname);

try {
  const blob = await put(pathname, png, {
    access: 'private',
    contentType: 'image/png',
    token,
    allowOverwrite: false,
  });
  console.log('PUT_OK');
  console.log('url', blob.url);
  console.log('pathname', blob.pathname);
  console.log('is_private_url', String(blob.url).includes('private.blob.vercel-storage.com'));

  const got = await get(blob.pathname, { access: 'private', token });
  console.log('GET_STATUS', got?.statusCode);
  if (got?.statusCode === 200 && got.stream) {
    const chunks = [];
    for await (const chunk of got.stream) chunks.push(chunk);
    const buf = Buffer.concat(chunks);
    console.log('GET_BYTES', buf.length);
    console.log('GET_IS_PNG', buf.slice(1, 4).toString('ascii') === 'PNG');
  }
  console.log('RESULT OK');
} catch (err) {
  console.error('RESULT FAIL');
  console.error(err?.message || err);
  process.exit(1);
}
