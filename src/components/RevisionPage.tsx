import { useEffect, useState } from 'react';
import Header from './Header';
import { compressImage } from '../lib/blob-upload';

type RevisionItem = { key: string; label: string };

interface RevisionData {
  id: number;
  referenceNumber: string;
  status: string;
  ownerName: string | null;
  requestorName: string | null;
  barangay: string | null;
  items: RevisionItem[];
  expiresAt: number;
  acceptsUploads: boolean;
}

type Phase = 'loading' | 'invalid' | 'ready' | 'submitting' | 'success' | 'not_accepting';

function readToken(): string {
  try {
    return new URLSearchParams(window.location.search).get('token') ?? '';
  } catch {
    return '';
  }
}

function formatDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function RevisionPage() {
  const [token] = useState(readToken);
  const [phase, setPhase] = useState<Phase>('loading');
  const [data, setData] = useState<RevisionData | null>(null);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [error, setError] = useState('');

  // This page must never be discoverable by search engines.
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    document.title = 'Upload Revised Documents — iAssess';
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setPhase('invalid');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/revision?token=${encodeURIComponent(token)}`);
        const json = await res.json().catch(() => null);
        if (cancelled) return;
        if (res.ok && json?.success && json.data) {
          setData(json.data as RevisionData);
          setPhase((json.data as RevisionData).acceptsUploads ? 'ready' : 'not_accepting');
        } else {
          setPhase('invalid');
        }
      } catch {
        if (!cancelled) {
          setError('Could not reach the server. Check your connection and try again.');
          setPhase('invalid');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const pickFile = (key: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
  };

  const allSelected = !!data && data.items.every((it) => files[it.key] instanceof File);

  const submit = async () => {
    if (!data || !token || !allSelected || phase === 'submitting') return;
    setPhase('submitting');
    setError('');
    try {
      const uploads: Array<{
        key: string;
        fileName: string;
        fileUrl: string;
        blobPathname: string;
        mimeType: string;
      }> = [];

      for (const item of data.items) {
        const raw = files[item.key];
        if (!(raw instanceof File)) throw new Error(`Missing file for: ${item.label}`);

        setUploadingKey(item.key);
        const file = await compressImage(raw);

        const fd = new FormData();
        fd.append('file', file);
        fd.append('applicationId', data.referenceNumber);
        fd.append('documentType', item.key);

        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.url) {
          throw new Error(json?.error || `Upload failed for: ${item.label}`);
        }
        uploads.push({
          key: item.key,
          fileName: file.name,
          fileUrl: json.url,
          blobPathname: json.pathname ?? '',
          mimeType: file.type || 'application/octet-stream',
        });
      }

      setUploadingKey(null);

      const submitRes = await fetch('/api/revision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, uploads }),
      });
      const submitJson = await submitRes.json().catch(() => null);
      if (!submitRes.ok || !submitJson?.success) {
        throw new Error(submitJson?.message || 'Could not submit your revision. Please try again.');
      }
      setPhase('success');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unexpected error. Please try again.');
      setPhase('ready');
    } finally {
      setUploadingKey(null);
    }
  };

  const card = 'bg-white rounded-lg shadow-sm p-4 sm:p-6';

  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <p className="text-gray-500 text-sm">Verifying your secure link…</p>
        </main>
      </div>
    );
  }

  if (phase === 'invalid') {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className={`${card} max-w-md w-full text-center`}>
            <div className="text-4xl mb-3" aria-hidden>
              🔗
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Link invalid or expired</h2>
            <p className="text-sm text-gray-600 mb-4">
              This revision link is invalid, has expired, or is no longer available. Please check
              your email for a newer message from the Municipal Assessor&apos;s Office, or contact
              us directly with your reference number.
            </p>
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <p className="text-xs text-gray-400">
              Municipal Assessor&apos;s Office, Balatan, Camarines Sur
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (phase === 'success') {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className={`${card} max-w-md w-full text-center`}>
            <div className="text-4xl mb-3" aria-hidden>
              ✅
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">Revision submitted</h2>
            <p className="text-sm text-gray-600 mb-3">
              Thank you! Your revised documents for{' '}
              <strong>{data?.referenceNumber}</strong> were submitted successfully.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Your application status is now <strong>Under Review</strong>. The Assessor&apos;s
              Office will notify you by email once it has been re-checked.
            </p>
            <p className="text-xs text-gray-400">
              Municipal Assessor&apos;s Office, Balatan, Camarines Sur
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (phase === 'not_accepting' && data) {
    const msg =
      data.status === 'under_review'
        ? 'Your revision was already submitted and is under review. There is nothing more to upload.'
        : 'This application is not accepting revisions right now. Please contact the Assessor\u2019s Office if you believe this is a mistake.';
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className={`${card} max-w-md w-full text-center`}>
            <div className="text-4xl mb-3" aria-hidden>
              📋
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-2">
              No upload needed for {data.referenceNumber}
            </h2>
            <p className="text-sm text-gray-600 mb-4">{msg}</p>
            <p className="text-xs text-gray-400">
              Municipal Assessor&apos;s Office, Balatan, Camarines Sur
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (!data) return null;

  const ready = phase === 'ready';

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className={card}>
            <h2 className="text-lg font-bold text-gray-800 mb-1">Upload Revised Documents</h2>
            <p className="text-sm text-gray-600 mb-4">
              The Assessor&apos;s Office requested clearer copies of the items below. Provide one
              image (or PDF) per requirement, then submit.
            </p>

            <div className="bg-gray-50 rounded-md p-3 mb-4 text-sm space-y-1">
              <p>
                <span className="text-gray-500">Reference #:</span>{' '}
                <strong>{data.referenceNumber}</strong>
              </p>
              {data.ownerName && (
                <p>
                  <span className="text-gray-500">Owner:</span> {data.ownerName}
                </p>
              )}
              {data.barangay && (
                <p>
                  <span className="text-gray-500">Barangay:</span> {data.barangay}
                </p>
              )}
              <p className="text-xs text-gray-400">Link expires on {formatDate(data.expiresAt)}</p>
            </div>

            <div className="space-y-4">
              {data.items.map((item) => {
                const file = files[item.key];
                const selected = file instanceof File;
                const busy = uploadingKey === item.key;
                return (
                  <div key={item.key} className="border border-gray-200 rounded-md p-3">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                        <p className="text-xs text-gray-500">
                          {selected ? (
                            <span className="text-green-700">✓ {file.name}</span>
                          ) : (
                            <span className="text-amber-600">Required — no file selected</span>
                          )}
                        </p>
                      </div>
                      {selected && (
                        <button
                          type="button"
                          onClick={() => pickFile(item.key, null)}
                          disabled={!ready}
                          className="text-xs text-red-600 underline shrink-0"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {selected && file.type.startsWith('image/') && (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={item.label}
                        className="max-h-40 rounded mb-2 border"
                      />
                    )}

                    <label className="inline-block">
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        disabled={!ready}
                        className="block text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-blue-700 file:text-white file:text-xs hover:file:bg-blue-800 file:cursor-pointer"
                        onChange={(e) => pickFile(item.key, e.target.files?.[0] ?? null)}
                      />
                    </label>
                    {busy && <p className="text-xs text-blue-600 mt-1">Uploading…</p>}
                  </div>
                );
              })}
            </div>

            {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

            <button
              type="button"
              onClick={submit}
              disabled={!ready || !allSelected || phase === 'submitting'}
              className={`mt-5 w-full py-3 rounded-md font-semibold text-white text-sm transition ${
                ready && allSelected && phase !== 'submitting'
                  ? 'bg-blue-700 hover:bg-blue-800 cursor-pointer'
                  : 'bg-gray-300 cursor-not-allowed text-gray-500'
              }`}
            >
              {phase === 'submitting'
                ? 'Submitting…'
                : allSelected
                  ? 'Submit Revision'
                  : 'Select a file for every requirement to continue'}
            </button>

            <p className="text-xs text-gray-400 text-center mt-4">
              Municipal Assessor&apos;s Office, Balatan, Camarines Sur
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
