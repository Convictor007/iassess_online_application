import type { DocumentType, PendingDocument, UploadedDocument } from '../types';

export interface UploadProgress {
  documentType: DocumentType;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

const MAX_DIMENSION = 2048;
const JPEG_QUALITY = 0.8;
const MAX_SIZE_BYTES = 4 * 1024 * 1024; // 4MB (Vercel limit is 4.5MB)

async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (file.size <= MAX_SIZE_BYTES) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        JPEG_QUALITY,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

function isLocalhost(): boolean {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return true;
  }
  return false;
}

export async function uploadDocumentToBlob(
  documentType: DocumentType,
  pending: PendingDocument,
  applicationId: string,
  onProgress?: (progress: number) => void,
): Promise<UploadedDocument> {
  if (isLocalhost()) {
    onProgress?.(100);
    return {
      fileName: pending.file.name,
      fileUrl: `local://${applicationId}/${documentType}/${pending.file.name}`,
      uploadedAt: new Date().toISOString(),
    };
  }

  const file = pending.file;

  onProgress?.(10);

  const compressed = await compressImage(file);

  onProgress?.(20);

  const formData = new FormData();
  formData.append('file', compressed);
  formData.append('applicationId', applicationId);
  formData.append('documentType', documentType);

  const result = await new Promise<{ url: string; pathname: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload');

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const uploadPct = Math.round((e.loaded / e.total) * 70) + 20;
        onProgress?.(Math.min(uploadPct, 90));
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
        } else {
          reject(new Error(data.error || 'Upload failed'));
        }
      } catch {
        reject(new Error('Server returned an invalid response. Please try again.'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error. Please check your connection.'));
    xhr.send(formData);
  });

  onProgress?.(100);

  return {
    fileName: file.name,
    fileUrl: result.url,
    uploadedAt: new Date().toISOString(),
  };
}

export async function uploadAllDocuments(
  documents: Partial<Record<DocumentType, PendingDocument[]>>,
  applicationId: string,
  onDocumentProgress?: (documentType: DocumentType, progress: UploadProgress) => void,
): Promise<{ uploaded: Partial<Record<DocumentType, UploadedDocument[]>>; errors: string[] }> {
  const uploaded: Partial<Record<DocumentType, UploadedDocument[]>> = {};
  const errors: string[] = [];

  const entries = Object.entries(documents) as [DocumentType, PendingDocument[]][];

  for (const [docType, pendingFiles] of entries) {
    onDocumentProgress?.(docType, {
      documentType: docType,
      progress: 0,
      status: 'uploading',
    });

    try {
      const results: UploadedDocument[] = [];
      for (let i = 0; i < pendingFiles.length; i++) {
        const result = await uploadDocumentToBlob(docType, pendingFiles[i], applicationId, (progress) => {
          onDocumentProgress?.(docType, {
            documentType: docType,
            progress,
            status: 'uploading',
          });
        });
        results.push(result);
      }

      uploaded[docType] = results;
      onDocumentProgress?.(docType, {
        documentType: docType,
        progress: 100,
        status: 'done',
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      errors.push(`${docType}: ${errorMsg}`);
      onDocumentProgress?.(docType, {
        documentType: docType,
        progress: 0,
        status: 'error',
        error: errorMsg,
      });
    }
  }

  return { uploaded, errors };
}
