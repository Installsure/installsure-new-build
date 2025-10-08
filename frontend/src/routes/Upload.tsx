import React, { useState } from "react";
import { Uploader } from "../components/Uploader";
import { api } from "../lib/api";

export default function Upload() {
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [forgeResult, setForgeResult] = useState<any>(null);
  const [translationResult, setTranslationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUploadSuccess = async (file: any) => {
    setUploadedFile(file);
    setError(null);

    // Automatically process with Forge
    await processWithForge(file);
  };

  const handleUploadError = (error: string) => {
    setError(error);
    setUploadedFile(null);
  };

  const processWithForge = async (file: any) => {
    setLoading(true);
    try {
      // Step 1: Get Forge auth token
      const authResult = await api.forgeAuth();
      console.log("Forge auth:", authResult);

      // Step 2: Read file and upload to Forge
      const response = await fetch(`/api/files/${file.id}`);
      const fileData = await response.json();

      // For demo purposes, we'll create a mock file buffer
      // In a real implementation, you'd read the actual file
      const mockBuffer = new ArrayBuffer(1024);

      const uploadResult = await api.forgeUpload(
        mockBuffer,
        file.original_name,
      );
      setForgeResult(uploadResult);

      // Step 3: Start translation
      const translateResult = await api.forgeTranslate(
        (uploadResult as any).objectId,
        file.original_name,
      );
      setTranslationResult(translateResult);
    } catch (err: any) {
      setError(err.message || "Forge processing failed");
    } finally {
      setLoading(false);
    }
  };

  const openViewer = () => {
    if (translationResult?.urn) {
      window.open(`/viewer/${translationResult.urn}`, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload BIM Model</h1>
        <p className="mt-1 text-sm text-gray-600">
          Upload your BIM model for processing and viewing
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <Uploader
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
        />
      </div>

      {uploadedFile && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Upload Results
          </h3>

          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900">File Uploaded</h4>
              <p className="text-sm text-gray-600">
                Name: {uploadedFile.original_name}
              </p>
              <p className="text-sm text-gray-600">
                Size: {(uploadedFile.file_size / 1024 / 1024).toFixed(2)} MB
              </p>
              <p className="text-sm text-gray-600">
                Type: {uploadedFile.file_type}
              </p>
            </div>

            {forgeResult && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900">Forge Upload</h4>
                <p className="text-sm text-gray-600">
                  Object ID: {forgeResult.objectId}
                </p>
                <p className="text-sm text-gray-600">
                  Bucket: {forgeResult.bucketKey}
                </p>
              </div>
            )}

            {translationResult && (
              <div className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900">Translation Job</h4>
                <p className="text-sm text-gray-600">
                  URN: {translationResult.urn}
                </p>
                <p className="text-sm text-gray-600">
                  Status: {translationResult.status}
                </p>
                <p className="text-sm text-gray-600">
                  Progress: {translationResult.progress}
                </p>

                {translationResult.status === "success" && (
                  <div className="mt-4">
                    <button
                      onClick={openViewer}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                      Open Viewer
                    </button>
                  </div>
                )}
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">
                  Processing with Forge...
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
