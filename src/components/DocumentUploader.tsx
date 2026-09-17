import { useRef, useEffect, useState } from 'react';
import type { DocumentType, PendingDocument } from '../types';

interface DocumentUploaderProps {
  documentType: DocumentType;
  label: string;
  required: boolean;
  files: PendingDocument[];
  maxFiles: number;
  onAdd: (doc: PendingDocument) => void;
  onRemove: (index: number) => void;
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
  files,
  maxFiles,
  onAdd,
  onRemove,
}: DocumentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [previewFile, setPreviewFile] = useState<PendingDocument | null>(null);

  const canAddMore = files.length < maxFiles;

  useEffect(() => {
    return () => {
      files.forEach((f) => {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      });
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

  return (
    <div className="flex flex-col">
      {/* Label */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {required && <span className="text-red-500 text-xs">*</span>}
        <span className="text-[10px] text-gray-400">({files.length}/{maxFiles})</span>
      </div>

      {/* Uploaded files */}
      {files.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {files.map((file, index) => {
            const isImg = isImage(file.file.type);
            return (
              <div
                key={index}
                className="flex items-center gap-2 border border-green-200 bg-green-50 rounded-lg px-2.5 py-2 cursor-pointer hover:bg-green-100 transition-colors"
                onClick={() => setPreviewFile(file)}
              >
                <i className={`bi ${isImg ? 'bi-image' : 'bi-file-earmark-text'} text-green-600 text-sm shrink-0`}></i>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-800 truncate">{file.file.name}</div>
                  <div className="text-[10px] text-gray-500">{formatFileSize(file.file.size)}</div>
                </div>
                <i className="bi bi-eye text-gray-400 text-xs shrink-0"></i>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(index); }}
                  className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm shrink-0"
                  title="Remove file"
                >
                  <i className="bi bi-x text-xs"></i>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add file drop zone */}
      {canAddMore ? (
        <div
          onDragOver={(e) => { e.preventDefault(); }}
          onDrop={handleDrop}
          className="border-2 border-dashed border-blue-300 bg-blue-50 hover:border-blue-400 hover:bg-blue-100 rounded-lg p-4 text-center transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <i className="bi bi-cloud-arrow-up text-3xl text-blue-500 mb-1"></i>
          <div className="text-xs text-gray-700 font-medium mb-2">
            {files.length === 0 ? 'Drag and drop or click to upload' : `Add more files (${files.length}/${maxFiles})`}
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
              className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 inline-flex items-center gap-1"
            >
              <i className="bi bi-folder2-open"></i> Gallery
            </button>
          </div>
          <div className="text-[10px] text-gray-500 mt-2">
            JPG, PNG, WebP, or PDF — Max 10MB each
          </div>
        </div>
      ) : (
        <div className="border border-gray-200 bg-gray-50 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-500">
            <i className="bi bi-check-circle-fill text-green-500 mr-1"></i>
            Maximum {maxFiles} files reached
          </div>
        </div>
      )}

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

      {/* File Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2 min-w-0">
                <i className={`bi ${isImage(previewFile.file.type) ? 'bi-image' : 'bi-file-earmark-text'} text-blue-600`}></i>
                <span className="text-sm font-medium text-gray-800 truncate">{previewFile.file.name}</span>
                <span className="text-xs text-gray-400 shrink-0">{formatFileSize(previewFile.file.size)}</span>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 shrink-0"
              >
                <i className="bi bi-x-lg text-gray-500"></i>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-50">
              {isImage(previewFile.file.type) ? (
                <img
                  src={previewFile.previewUrl}
                  alt={previewFile.file.name}
                  className="max-w-full max-h-[70vh] object-contain rounded"
                />
              ) : (
                <iframe
                  src={previewFile.previewUrl}
                  className="w-full h-[70vh] rounded border border-gray-200"
                  title={previewFile.file.name}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
