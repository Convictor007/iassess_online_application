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
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadStage, setUploadStage] = useState<'preparing' | 'uploading' | null>(null);
  const [error, setError] = useState('');

  // Captured before the early returns below — TS aliased-condition narrowing
  // would otherwise narrow `phase` to 'ready' inside `ready && … phase === …`
  // expressions and flag those comparisons as impossible.
  const isSubmitting = phase === 'submitting';

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
    setUploadProgress((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
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
        setUploadStage('preparing');
        setUploadProgress((prev) => ({ ...prev, [item.key]: 0 }));
        const file = await compressImage(raw);

        const fd = new FormData();
        fd.append('file', file);
        fd.append('applicationId', data.referenceNumber);
        fd.append('documentType', item.key);

        setUploadStage('uploading');
        const json = await new Promise<{ url: string; pathname?: string }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/upload');
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              setUploadProgress((prev) => ({
                ...prev,
                [item.key]: Math.round((event.loaded / event.total) * 100),
              }));
            }
          };
          xhr.onload = () => {
            let response: { url?: string; pathname?: string; error?: string } | null = null;
            try {
              response = JSON.parse(xhr.responseText) as {
                url?: string;
                pathname?: string;
                error?: string;
              };
            } catch {
              response = null;
            }
            if (xhr.status >= 200 && xhr.status < 300 && response?.url) {
              setUploadProgress((prev) => ({ ...prev, [item.key]: 100 }));
              resolve({ url: response.url, pathname: response.pathname });
              return;
            }
            reject(new Error(response?.error || `Upload failed for: ${item.label} (HTTP ${xhr.status}).`));
          };
          xhr.onerror = () => reject(new Error(`Network error while uploading ${item.label}. Check your connection and retry.`));
          xhr.onabort = () => reject(new Error(`Upload cancelled for ${item.label}.`));
          xhr.send(fd);
        });
        uploads.push({
          key: item.key,
          fileName: file.name,
          fileUrl: json.url,
          blobPathname: json.pathname ?? '',
          mimeType: file.type || 'application/octet-stream',
        });
      }

      setUploadingKey(null);
      setUploadStage(null);

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
      setUploadStage(null);
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
              The Assessor&apos;s Office requested clearer copies of the items below. Upload one
              replacement image (or PDF) for each requirement; it will replace the current document.
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
                const progress = uploadProgress[item.key] ?? 0;
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
                    {busy && (
                      <div className="mt-3" aria-live="polite">
                        <div className="flex items-center justify-between text-xs text-blue-700 mb-1">
                          <span>{uploadStage === 'preparing' ? 'Preparing file…' : 'Uploading…'}</span>
                          {uploadStage === 'uploading' && <span>{progress}%</span>}
                        </div>
                        <div
                          className="h-2 w-full overflow-hidden rounded-full bg-blue-100"
                          role="progressbar"
                          aria-label={`Uploading ${item.label}`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={uploadStage === 'preparing' ? 0 : progress}
                        >
                          <div
                            className="h-full rounded-full bg-blue-700 transition-[width] duration-200"
                            style={{ width: `${uploadStage === 'preparing' ? 5 : progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {!busy && progress === 100 && isSubmitting && (
                      <p className="text-xs text-green-700 mt-2">Upload complete</p>
                    )}
                  </div>
                );
              })}
            </div>

            {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

            <button
              type="button"
              onClick={submit}
              disabled={!ready || !allSelected || isSubmitting}
              className={`mt-5 w-full py-3 rounded-md font-semibold text-white text-sm transition ${
                ready && allSelected && !isSubmitting
                  ? 'bg-blue-700 hover:bg-blue-800 cursor-pointer'
                  : 'bg-gray-300 cursor-not-allowed text-gray-500'
              }`}
            >
              {isSubmitting
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
