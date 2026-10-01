/**
 * Live check: POST a tiny image to production /api/upload
 * and confirm the returned blob URL is private.
 */
import fs from 'node:fs';

const API_BASE = process.env.API_BASE || 'https://iassess.vercel.app';
const token = process.env.BLOB_READ_WRITE_TOKEN || '';

function makePngBuffer() {
  // Minimal valid 1x1 PNG
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
  return png;
}

async function main() {
  const png = makePngBuffer();
  const boundary = '----iassessBlobTest' + Date.now();
  const applicationId = 'BAL-TEST-' + Date.now();
  const documentType = 'valid_id';
  const fileName = 'pixel.png';

  const parts = [];
  parts.push(`--${boundary}\r\n`);
  parts.push(`Content-Disposition: form-data; name="applicationId"\r\n\r\n`);
  parts.push(`${applicationId}\r\n`);
  parts.push(`--${boundary}\r\n`);
  parts.push(`Content-Disposition: form-data; name="documentType"\r\n\r\n`);
  parts.push(`${documentType}\r\n`);
  parts.push(`--${boundary}\r\n`);
  parts.push(`Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`);
  parts.push(`Content-Type: image/png\r\n\r\n`);
  const bodyHead = Buffer.from(parts.join(''), 'utf8');
  const bodyTail = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
  const body = Buffer.concat([bodyHead, png, bodyTail]);

  console.log('POST', `${API_BASE}/api/upload`);
  const res = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body,
  });

  const text = await res.text();
  console.log('STATUS', res.status);
  console.log('BODY', text);

  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    /* ignore */
  }

  if (!res.ok || !data?.url) {
    process.exitCode = 1;
    return;
  }

  const isPrivate = String(data.url).includes('private.blob.vercel-storage.com');
  console.log('IS_PRIVATE_URL', isPrivate);
  console.log('PATHNAME', data.pathname || null);

  try {
    const publicRes = await fetch(data.url);
    console.log('PUBLIC_FETCH_STATUS', publicRes.status);
  } catch (err) {
    console.log('PUBLIC_FETCH_ERROR', err.message);
  }

  if (isPrivate && data.pathname && token) {
    const { get } = await import('@vercel/blob');
    const got = await get(data.pathname, { access: 'private', token });
    console.log('LOCAL_GET_STATUS', got?.statusCode);
  }

  console.log('DONE');
}

main().catch((err) => {
  console.error('TEST_ERROR', err);
  process.exit(1);
});
