import { useState, useCallback, useRef } from 'react';

export interface UploadProgress {
  /** 0–100 */
  percent: number;
  /** bytes uploaded so far */
  loaded: number;
  /** total file bytes */
  total: number;
  /** upload speed in bytes/second (rolling average over last 1s) */
  speedBytesPerSec: number;
  /** estimated seconds remaining, or Infinity if not yet calculable */
  etaSeconds: number;
}

const INITIAL_PROGRESS: UploadProgress = {
  percent: 0,
  loaded: 0,
  total: 0,
  speedBytesPerSec: 0,
  etaSeconds: Infinity,
};

/**
 * Returns progress state and an `onProgress` handler suitable for
 * XMLHttpRequest `upload.onprogress` events.
 *
 * @example
 * ```tsx
 * const { progress, onProgress, reset } = useUploadProgress();
 * xhr.upload.onprogress = onProgress;
 * ```
 */
export function useUploadProgress() {
  const [progress, setProgress] = useState<UploadProgress>(INITIAL_PROGRESS);
  const speedSampleRef = useRef<{ time: number; loaded: number } | null>(null);

  const onProgress = useCallback((event: ProgressEvent) => {
    if (!event.lengthComputable) return;

    const now = Date.now();
    const sample = speedSampleRef.current;
    let speedBytesPerSec = 0;
    let etaSeconds = Infinity;

    if (sample) {
      const dtSec = (now - sample.time) / 1000;
      if (dtSec > 0) {
        speedBytesPerSec = (event.loaded - sample.loaded) / dtSec;
        const remaining = event.total - event.loaded;
        etaSeconds = speedBytesPerSec > 0 ? remaining / speedBytesPerSec : Infinity;
      }
    }

    // Refresh speed sample every ~200 ms
    if (!sample || now - sample.time > 200) {
      speedSampleRef.current = { time: now, loaded: event.loaded };
    }

    setProgress({
      percent: Math.round((event.loaded / event.total) * 100),
      loaded: event.loaded,
      total: event.total,
      speedBytesPerSec,
      etaSeconds,
    });
  }, []);

  const reset = useCallback(() => {
    speedSampleRef.current = null;
    setProgress(INITIAL_PROGRESS);
  }, []);

  return { progress, onProgress, reset };
}
