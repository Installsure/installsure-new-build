import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, CheckCircle } from 'lucide-react';
import { PlansUpload } from '../components/PlansUpload.js';
import type { PlanFile } from '../hooks/useFileUpload.js';
import { api } from '../lib/api.js';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function PlansPage() {
  const [uploadedFiles, setUploadedFiles] = useState<PlanFile[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: () => api.getHealth(),
  });

  const handleSuccess = (planFile: PlanFile) => {
    setUploadError(null);
    setUploadedFiles((prev) => {
      // Avoid duplicates (deduplication by id)
      if (prev.some((f) => f.id === planFile.id)) return prev;
      return [planFile, ...prev];
    });
  };

  const handleError = (message: string) => {
    setUploadError(message);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Plans</h1>
        <p className="mt-1 text-sm text-gray-600">
          Upload and manage construction plan files. Files are deduplicated by SHA-256 checksum.
        </p>
      </div>

      {/* System health warning */}
      {health && !health.ok && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
          <p className="text-sm font-medium text-yellow-800">
            System warning: back-end health check failed. Uploads may not work correctly.
          </p>
        </div>
      )}

      {/* Upload area */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Upload a Plan</h2>
        <PlansUpload onSuccess={handleSuccess} onError={handleError} />
        {uploadError && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {uploadError}
          </p>
        )}
      </div>

      {/* Uploaded files list */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Recently Uploaded ({uploadedFiles.length})
          </h2>
          <ul className="divide-y divide-gray-100" aria-label="Uploaded plan files">
            {uploadedFiles.map((file) => (
              <li key={file.id} className="py-3 flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <FileText className="h-5 w-5 text-blue-500" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" aria-label="Upload verified" />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {file.type} · {formatBytes(file.size)}
                    {file.project_id && <> · Project: {file.project_id}</>}
                  </p>
                  <p
                    className="text-xs text-gray-400 font-mono mt-0.5 truncate"
                    title={`SHA-256: ${file.checksum}`}
                  >
                    {file.checksum}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
