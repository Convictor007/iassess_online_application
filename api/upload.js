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

    busboy.on('field', (name, value) => {
      fields[name] = value;
    });

    busboy.on('file', (fieldname, stream, info) => {
      const chunks = [];
      fileName = info.filename;
      fileMime = info.mimeType;

      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    busboy.on('finish', () => {
      resolve({ fields, fileBuffer, fileName, fileMime });
    });

    busboy.on('error', (err) => reject(err));

    req.pipe(busboy);
  });
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({
      error: 'BLOB_READ_WRITE_TOKEN is not configured. Please add it to your .env file.',
    });
  }

  try {
    const { fields, fileBuffer, fileName, fileMime } = await parseMultipart(req);

    const applicationId = fields.applicationId;
    const documentType = fields.documentType;

    if (!fileBuffer || !applicationId || !documentType) {
      return res.status(400).json({ error: 'Missing file, applicationId, or documentType' });
    }

    if (!ALLOWED_TYPES.includes(fileMime)) {
      return res.status(400).json({
        error: `Invalid file type: ${fileMime}. Allowed: ${ALLOWED_TYPES.join(', ')}`,
      });
    }

    // Determine file extension
    const extMap = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/heic': 'heic',
      'application/pdf': 'pdf',
    };
    const ext = extMap[fileMime] || 'bin';
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

    const pathname = `${applicationId}/${documentType}-${Date.now()}-${safeName}`;

    const blob = await put(pathname, fileBuffer, {
      access: 'private',
      contentType: fileMime,
    });

    return res.status(200).json({
      url: blob.url,
      pathname: blob.pathname,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: error.message || 'Failed to upload file' });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
