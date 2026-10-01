import { get } from '@vercel/blob';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
}

function pathnameFromBlobUrl(fileUrl) {
  if (!fileUrl) return null;
  try {
    const url = new URL(fileUrl);
    if (!url.hostname.includes('blob.vercel-storage.com')) return null;
    return decodeURIComponent(url.pathname.replace(/^\/+/, ''));
  } catch {
    return null;
  }
}

function isPublicBlobUrl(fileUrl) {
  return (
    typeof fileUrl === 'string' &&
    fileUrl.includes('public.blob.vercel-storage.com') &&
    !fileUrl.includes('private.blob')
  );
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, pathname: pathnameParam } = req.query;

  if (!url && !pathnameParam) {
    return res.status(400).json({ error: 'Missing url or pathname parameter' });
  }

  // Legacy public blobs can still be opened directly.
  if (isPublicBlobUrl(url)) {
    return res.redirect(url);
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return res.status(500).json({
      error: 'BLOB_READ_WRITE_TOKEN is not configured for private document access.',
    });
  }

  // Prefer explicit pathname (saved in DB), then derive it from the blob URL.
  const pathname =
    (typeof pathnameParam === 'string' && pathnameParam.trim()) || pathnameFromBlobUrl(url);

  if (!pathname) {
    return res.status(400).json({ error: 'Invalid blob pathname/url' });
  }

  try {
    const blobResponse = await get(pathname, {
      access: 'private',
      token,
    });

    if (!blobResponse || blobResponse.statusCode !== 200 || !blobResponse.stream) {
      return res.status(404).json({ error: 'Document not found in blob store' });
    }

    const contentType =
      blobResponse.blob?.contentType ||
      blobResponse.headers?.get?.('content-type') ||
      'application/octet-stream';

    const contentDisposition =
      blobResponse.blob?.contentDisposition ||
      blobResponse.headers?.get?.('content-disposition') ||
      'inline';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', contentDisposition);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const { Readable } = await import('node:stream');
    const nodeStream = Readable.fromWeb(blobResponse.stream);
    nodeStream.pipe(res);
  } catch (error) {
    console.error('documents/view GET error:', error);
    return res.status(500).json({ error: 'Failed to load document' });
  }
}
