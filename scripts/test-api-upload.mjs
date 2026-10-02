/**
 * Test /api/upload with a tiny PNG.
 * Set API_BASE to hit production or a local Vercel dev server.
 *
 *   node scripts/test-api-upload.mjs
 *   API_BASE=http://127.0.0.1:3001 node scripts/test-api-upload.mjs
 *   API_BASE=http://localhost:8081 node scripts/test-api-upload.mjs
 */

const API_BASE = (process.env.API_BASE || 'https://iassess.vercel.app').replace(/\/$/, '');

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

function buildMultipart() {
  const boundary = '----iassessUploadTest' + Date.now();
  const applicationId = 'BAL-UPLOAD-TEST-' + Date.now();
  const documentType = 'valid_id';
  const fileName = 'pixel.png';

  const parts = [];
  parts.push(`--${boundary}\r\n`);
  parts.push('Content-Disposition: form-data; name="applicationId"\r\n\r\n');
  parts.push(`${applicationId}\r\n`);
  parts.push(`--${boundary}\r\n`);
  parts.push('Content-Disposition: form-data; name="documentType"\r\n\r\n');
  parts.push(`${documentType}\r\n`);
  parts.push(`--${boundary}\r\n`);
  parts.push(
    `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`,
  );
  parts.push('Content-Type: image/png\r\n\r\n');

  const bodyHead = Buffer.from(parts.join(''), 'utf8');
  const bodyTail = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');

  return {
    boundary,
    applicationId,
    documentType,
    body: Buffer.concat([bodyHead, png, bodyTail]),
  };
}

async function main() {
  const { boundary, applicationId, documentType, body } = buildMultipart();

  console.log('API_BASE', API_BASE);
  console.log('POST', `${API_BASE}/api/upload`);
  console.log('applicationId', applicationId);
  console.log('documentType', documentType);
  console.log('body_bytes', body.length);

  let res;
  try {
    res = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body,
    });
  } catch (err) {
    console.error('NETWORK_ERROR', err.message);
    process.exit(1);
  }

  const text = await res.text();
  console.log('STATUS', res.status);
  console.log('BODY', text);

  let data = null;
  try {
    data = JSON.parse(text);
  } catch {
    /* not JSON */
  }

  if (!res.ok || !data?.url) {
    console.log('RESULT FAIL');
    process.exit(1);
  }

  const isPrivate = String(data.url).includes('private.blob.vercel-storage.com');
  const isPublic = String(data.url).includes('public.blob.vercel-storage.com');
  console.log('URL', data.url);
  console.log('PATHNAME', data.pathname || null);
  console.log('ACCESS_FIELD', data.access || null);
  console.log('IS_PRIVATE_URL', isPrivate);
  console.log('IS_PUBLIC_URL', isPublic);

  if (isPrivate && data.pathname) {
    try {
      const { get } = await import('@vercel/blob');
      const token = process.env.BLOB_READ_WRITE_TOKEN || '';
      const got = await get(data.pathname, { access: 'private', token });
      console.log('LOCAL_GET_STATUS', got?.statusCode);
      if (got?.statusCode === 200 && got.stream) {
        const chunks = [];
        for await (const chunk of got.stream) chunks.push(chunk);
        const buf = Buffer.concat(chunks);
        console.log('LOCAL_GET_BYTES', buf.length);
        console.log('LOCAL_GET_IS_PNG', buf.slice(1, 4).toString('ascii') === 'PNG');
      }
    } catch (err) {
      console.log('LOCAL_GET_ERROR', err.message);
    }
  }

  if (isPublic) {
    try {
      const publicRes = await fetch(data.url);
      console.log('PUBLIC_FETCH_STATUS', publicRes.status);
    } catch (err) {
      console.log('PUBLIC_FETCH_ERROR', err.message);
    }
  }

  console.log('RESULT OK');
}

main().catch((err) => {
  console.error('TEST_ERROR', err);
  process.exit(1);
});
