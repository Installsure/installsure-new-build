import React, { useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload, CheckCircle, XCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { useFileUpload, UploadOptions } from '../hooks/useFileUpload.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCEPTED_MIME_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'application/octet-stream': ['.ifc', '.dwg', '.rvt', '.step', '.obj'],
  'model/gltf+json': ['.gltf'],
  'model/gltf-binary': ['.glb'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
};

/** 500 MB expressed in bytes */
const MAX_SIZE_BYTES = 500 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatEta(seconds: number): string {
  if (!isFinite(seconds)) return '';
  if (seconds < 60) return `${Math.ceil(seconds)}s remaining`;
  return `${Math.ceil(seconds / 60)}m remaining`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PlansUploadProps {
  /** Called after a successful upload with the returned plan file metadata. */
  onSuccess?: (planFile: import('../hooks/useFileUpload.js').PlanFile) => void;
  /** Called when an upload error occurs. */
  onError?: (message: string) => void;
  projectId?: string;
  uploadedById?: string;
  /** Optional extra CSS classes for the outer wrapper. */
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * PlansUpload
 *
 * Drag-and-drop plan file uploader with:
 * - Real-time upload progress
 * - Automatic retry on transient errors
 * - File type and size validation
 * - Accessible keyboard support (WCAG 2.1)
 */
export function PlansUpload({
  onSuccess,
  onError,
  projectId,
  uploadedById,
  className = '',
}: PlansUploadProps) {
  const { status, progress, result, error, retryable, upload, reset } = useFileUpload();

  const handleUpload = useCallback(
    async (file: File) => {
      const options: UploadOptions = {};
      if (projectId) options.projectId = projectId;
      if (uploadedById) options.uploadedById = uploadedById;

      await upload(file, options);
    },
    [upload, projectId, uploadedById],
  );

  const onDrop = useCallback(
    async (accepted: File[], rejections: FileRejection[]) => {
      if (rejections.length > 0) {
        const msg = rejections[0].errors[0]?.message ?? 'File rejected';
        onError?.(msg);
        return;
      }
      if (accepted.length === 0) return;
      const file = accepted[0];

      try {
        await handleUpload(file);
        // Notify parent on success
      } catch {
        // error state is managed inside useFileUpload
      }
    },
    [handleUpload, onError],
  );

  // Notify parent components of state changes
  React.useEffect(() => {
    if (status === 'success' && result) {
      onSuccess?.(result);
    }
  }, [status, result, onSuccess]);

  React.useEffect(() => {
    if (status === 'error' && error) {
      onError?.(error);
    }
  }, [status, error, onError]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_MIME_TYPES,
    maxSize: MAX_SIZE_BYTES,
    maxFiles: 1,
    disabled: status === 'uploading',
  });

  // ─── Derived UI state ──────────────────────────────────────────────────────

  const isUploading = status === 'uploading';
  const isSuccess = status === 'success';
  const isError = status === 'error';

  const borderColor = isDragReject || isError
    ? 'border-red-400'
    : isDragActive
      ? 'border-blue-500'
      : isSuccess
        ? 'border-green-400'
        : 'border-gray-300';

  const bgColor = isDragActive ? 'bg-blue-50' : isSuccess ? 'bg-green-50' : 'bg-white';

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={`w-full ${className}`} aria-label="Plan file upload area">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`relative rounded-xl border-2 border-dashed transition-colors duration-200 cursor-pointer
          ${borderColor} ${bgColor}
          ${isUploading ? 'cursor-not-allowed opacity-75' : 'hover:border-blue-400 hover:bg-blue-50'}
          p-8 flex flex-col items-center justify-center gap-3 text-center min-h-[200px]`}
        role="button"
        tabIndex={0}
        aria-disabled={isUploading}
        aria-describedby="plans-upload-desc"
      >
        <input {...getInputProps()} aria-label="Upload plan file" />

        {/* Icon */}
        {isSuccess ? (
          <CheckCircle className="h-12 w-12 text-green-500" aria-hidden="true" />
        ) : isError ? (
          <XCircle className="h-12 w-12 text-red-500" aria-hidden="true" />
        ) : isDragReject ? (
          <AlertCircle className="h-12 w-12 text-red-400" aria-hidden="true" />
        ) : (
          <Upload
            className={`h-12 w-12 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`}
            aria-hidden="true"
          />
        )}

        {/* Main message */}
        {isSuccess && result ? (
          <div className="space-y-1">
            <p className="text-lg font-semibold text-green-700">Upload complete</p>
            <p className="text-sm text-gray-600">
              {result.name} · {formatBytes(result.size)}
            </p>
            <p className="text-xs text-gray-400 font-mono break-all" title="SHA-256 checksum">
              SHA-256: {result.checksum}
            </p>
          </div>
        ) : isError ? (
          <div className="space-y-1">
            <p className="text-lg font-semibold text-red-700">Upload failed</p>
            <p className="text-sm text-red-600" role="alert">{error}</p>
          </div>
        ) : isDragReject ? (
          <p className="text-sm text-red-600">
            File type or size not supported
          </p>
        ) : isDragActive ? (
          <p className="text-lg font-medium text-blue-600">Drop your file here</p>
        ) : (
          <div className="space-y-1" id="plans-upload-desc">
            <p className="text-base font-medium text-gray-700">
              Drag &amp; drop or{' '}
              <span className="text-blue-600 underline">browse</span>
            </p>
            <p className="text-sm text-gray-500">
              PDF, IFC, DWG, RVT, STEP, OBJ, GLTF, GLB, PNG, JPG — up to 500 MB
            </p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {isUploading && (
        <div className="mt-4" role="progressbar" aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100}>
          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
            <span>Uploading… {progress.percent}%</span>
            <span className="text-gray-400">
              {formatBytes(progress.loaded)} / {formatBytes(progress.total)}
              {progress.speedBytesPerSec > 0 && (
                <> · {formatBytes(progress.speedBytesPerSec)}/s</>
              )}
              {' '}
              {formatEta(progress.etaSeconds)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-200"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      {(isSuccess || isError) && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg
              border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            aria-label="Upload another file"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {isError && retryable ? 'Retry' : 'Upload another'}
          </button>
        </div>
      )}
    </div>
  );
}

export default PlansUpload;
