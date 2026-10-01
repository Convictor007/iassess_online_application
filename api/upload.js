import { put } from '@vercel/blob';
import Busboy from 'busboy';

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'application/pdf',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers, limits: { fileSize: MAX_FILE_SIZE } });
    const fields = {};
    let fileBuffer = null;
    let fileName = '';
    let fileMime = '';
    let truncated = false;

    busboy.on('field', (name, value) => {
      fields[name] = value;
    });

    busboy.on('file', (fieldname, stream, info) => {
      const chunks = [];
      fileName = info.filename;
      fileMime = info.mimeType;

      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('limit', () => {
        truncated = true;
      });
      stream.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    busboy.on('finish', () => {
      resolve({ fields, fileBuffer, fileName, fileMime, truncated });
    });

    busboy.on('error', (err) => reject(err));

    req.pipe(busboy);
  });
}

function blobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN || '';
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = blobToken();
  if (!token) {
    return res.status(500).json({
      error:
        'BLOB_READ_WRITE_TOKEN is not configured. Add the private-store Vercel Blob token to .env / Vercel env vars.',
    });
  }

  try {
    const { fields, fileBuffer, fileName, fileMime, truncated } = await parseMultipart(req);

    const applicationId = fields.applicationId;
    const documentType = fields.documentType;

    if (truncated) {
      return res.status(413).json({ error: 'File too large. Maximum size is 10MB.' });
    }

    if (!fileBuffer || !applicationId || !documentType) {
      return res.status(400).json({ error: 'Missing file, applicationId, or documentType' });
    }

    if (!ALLOWED_TYPES.includes(fileMime)) {
      return res.status(400).json({
        error: `Invalid file type: ${fileMime}. Allowed: ${ALLOWED_TYPES.join(', ')}`,
      });
    }

    const extMap = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/heic': 'heic',
      'application/pdf': 'pdf',
    };
    const ext = extMap[fileMime];
    let safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_') || `upload.${ext || 'bin'}`;
    if (!/\.[a-z0-9]+$/i.test(safeName) && ext) {
      safeName = `${safeName}.${ext}`;
    }
    const pathname = `${applicationId}/${documentType}-${Date.now()}-${safeName}`;

    // Blob store is private. Public access throws:
    // "Cannot use public access on a private store."
    const blob = await put(pathname, fileBuffer, {
      access: 'private',
      contentType: fileMime,
      token,
      allowOverwrite: false,
    });

    return res.status(200).json({
      url: blob.url,
      pathname: blob.pathname,
      access: 'private',
    });
  } catch (error) {
    console.error('Upload error:', error);
    const message = error?.message || 'Failed to upload file';
    const isPrivateStoreError = /public access on a private store/i.test(message);
    return res.status(500).json({
      error: isPrivateStoreError
        ? 'Blob store is private, but the upload tried public access. Redeploy with access: "private" in api/upload.js.'
        : message,
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
