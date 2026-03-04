import { useState, useCallback } from 'react';
import { useUploadProgress, UploadProgress } from './useUploadProgress.js';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export interface PlanFile {
  id: string;
  name: string;
  checksum: string;
  size: number;
  mime_type: string;
  path: string;
  project_id: string | null;
  type: string;
  created_at: string;
}

export interface UseFileUploadReturn {
  status: UploadStatus;
  progress: UploadProgress;
  result: PlanFile | null;
  error: string | null;
  /** true when the last error is safe to retry */
  retryable: boolean;
  upload: (file: File, options?: UploadOptions) => Promise<void>;
  reset: () => void;
}

export interface UploadOptions {
  projectId?: string;
  uploadedById?: string;
}

/** Returns true for HTTP status codes that are worth retrying. */
function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Uploads a file to `POST /api/plans/upload` with:
 * - Real-time progress tracking (via XHR)
 * - Automatic exponential-backoff retry on transient errors
 * - User-facing status and error state
 */
export function useFileUpload(): UseFileUploadReturn {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [result, setResult] = useState<PlanFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryable, setRetryable] = useState(false);
  const { progress, onProgress, reset: resetProgress } = useUploadProgress();

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError(null);
    setRetryable(false);
    resetProgress();
  }, [resetProgress]);

  const uploadOnce = useCallback(
    (file: File, options: UploadOptions = {}): Promise<PlanFile> => {
      return new Promise<PlanFile>((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        if (options.projectId) formData.append('projectId', options.projectId);
        if (options.uploadedById) formData.append('uploadedById', options.uploadedById);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE}/api/plans/upload`);

        xhr.upload.onprogress = onProgress;

        xhr.onload = () => {
          try {
            const body = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(body as PlanFile);
            } else {
              const err: any = new Error(body?.error || `HTTP ${xhr.status}`);
              err.status = xhr.status;
              err.retryable = body?.retryable ?? isRetryableStatus(xhr.status);
              reject(err);
            }
          } catch {
            const err: any = new Error(`HTTP ${xhr.status}: ${xhr.statusText}`);
            err.status = xhr.status;
            err.retryable = isRetryableStatus(xhr.status);
            reject(err);
          }
        };

        xhr.onerror = () => {
          const err: any = new Error('Network error – check your connection');
          err.retryable = true;
          reject(err);
        };

        xhr.ontimeout = () => {
          const err: any = new Error('Upload timed out');
          err.retryable = true;
          reject(err);
        };

        xhr.send(formData);
      });
    },
    [onProgress],
  );

  const upload = useCallback(
    async (file: File, options: UploadOptions = {}) => {
      reset();
      setStatus('uploading');

      let lastError: any = null;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const planFile = await uploadOnce(file, options);
          setResult(planFile);
          setStatus('success');
          return;
        } catch (err: any) {
          lastError = err;

          const canRetry = (err?.retryable ?? false) && attempt < MAX_RETRIES;

          if (!canRetry) {
            break;
          }

          // Exponential back-off before next attempt
          await delay(BASE_DELAY_MS * Math.pow(2, attempt));
          // Reset progress for the retry
          resetProgress();
        }
      }

      // All attempts failed
      setError(lastError?.message || 'Upload failed');
      setRetryable(lastError?.retryable ?? false);
      setStatus('error');
    },
    [uploadOnce, reset, resetProgress],
  );

  return { status, progress, result, error, retryable, upload, reset };
}
