import { getDownloadUrl } from '@vercel/blob';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pathname } = req.query;

  if (!pathname) {
    return res.status(400).json({ error: 'Missing pathname parameter' });
  }

  try {
    // Get a signed download URL valid for 1 hour
    const url = getDownloadUrl(pathname, {
      expiresIn: 3600, // 1 hour
    });

    return res.status(200).json({
      success: true,
      url,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error('Document view error:', error);
    return res.status(500).json({ error: 'Failed to generate download URL' });
  }
}
