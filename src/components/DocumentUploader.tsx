import { useRef, useEffect } from 'react';
import type { DocumentType, PendingDocument } from '../types';

interface DocumentUploaderProps {
  documentType: DocumentType;
  label: string;
  required: boolean;
  pending: PendingDocument | null;
  onAdd: (doc: PendingDocument) => void;
  onRemove: () => void;
}

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(type: string) {
  return type.startsWith('image/');
}

export default function DocumentUploader({
  label,
  required,
  pending,
  onAdd,
  onRemove,
}: DocumentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (pending?.previewUrl) {
        URL.revokeObjectURL(pending.previewUrl);
      }
    };
  }, []);

  const handleFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('Invalid file type. Accepted: JPG, PNG, WebP, PDF');
      return;
    }

    if (file.size > MAX_SIZE) {
      alert('File too large. Maximum size: 10MB');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    onAdd({
      file,
      previewUrl,
      addedAt: new Date().toISOString(),
    });
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  // Preview state
  if (pending) {
    const isImg = isImage(pending.file.type);
    return (
      <div className="border border-green-200 bg-green-50 rounded-lg overflow-hidden h-full flex flex-col">
        {/* Preview */}
        <div className="relative bg-gray-100 flex items-center justify-center" style={{ minHeight: isImg ? 120 : 60 }}>
          {isImg ? (
            <img
              src={pending.previewUrl}
              alt={pending.file.name}
              className="w-full h-full object-cover"
              style={{ minHeight: 120 }}
            />
          ) : (
            <div className="flex flex-col items-center py-4 px-2">
              <i className="bi bi-file-earmark-text text-3xl text-gray-400 mb-1"></i>
              <span className="text-[10px] text-gray-500 text-center leading-tight px-2">{pending.file.name}</span>
            </div>
          )}
          {/* Remove button */}
          <button
            onClick={onRemove}
            className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm"
            title="Remove file"
          >
            <i className="bi bi-x text-sm"></i>
          </button>
        </div>
        {/* Info */}
        <div className="px-2.5 py-2 flex items-center gap-2">
          <i className="bi bi-check-circle-fill text-green-600 text-sm shrink-0"></i>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-gray-800 truncate">{pending.file.name}</div>
            <div className="text-[10px] text-gray-500">{formatFileSize(pending.file.size)} — Ready to upload on submit</div>
          </div>
        </div>
      </div>
    );
  }

  // Empty upload state
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {required && <span className="text-red-500 text-xs">*</span>}
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); }}
        onDrop={handleDrop}
        className="flex-1 border-2 border-dashed border-gray-200 hover:border-gray-300 rounded-lg p-4 text-center transition-colors flex flex-col items-center justify-center cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <i className="bi bi-cloud-arrow-up text-3xl text-gray-400 mb-2"></i>
        <div className="text-xs text-gray-600 mb-2">
          Drag and drop or click to upload
        </div>
        <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 inline-flex items-center gap-1"
          >
            <i className="bi bi-camera"></i> Camera
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 inline-flex items-center gap-1"
          >
            <i className="bi bi-folder2-open"></i> Gallery
          </button>
        </div>
        <div className="text-[10px] text-gray-400 mt-2">
          JPG, PNG, WebP, or PDF — Max 10MB
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileInput}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  );
}
