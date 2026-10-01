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

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing url parameter" });
  }

  // Public blob URLs can still be opened directly.
  if (url.includes('public.blob.vercel-storage.com') && !url.includes('private.blob')) {
    return res.redirect(url);
  }

  // Private store blobs must be streamed through the server with the token.
  const pathname = pathnameFromBlobUrl(url);
  if (!pathname) {
    return res.status(400).json({ error: "Invalid blob URL" });
  }

  try {
    const blobResponse = await get(pathname, { access: 'private' });

    if (!blobResponse || blobResponse.statusCode !== 200) {
      return res.status(502).json({ error: "Failed to fetch document" });
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

    // Convert Web ReadableStream → Node stream
    const { Readable } = await import('node:stream');
    const nodeStream = Readable.fromWeb(blobResponse.stream);
    nodeStream.pipe(res);
  } catch (error) {
    console.error('documents/view GET error:', error);
    return res.status(500).json({ error: 'Failed to load document' });
  }
}
