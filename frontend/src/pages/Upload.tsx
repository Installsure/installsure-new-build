import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Uploader } from "../components/Uploader.js";
import { api } from "../lib/api.js";
import { toast } from "react-hot-toast";
import { FileText, ExternalLink, AlertCircle } from "lucide-react";

export default function Upload() {
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [forgeResult, setForgeResult] = useState<any>(null);
  const [translationResult, setTranslationResult] = useState<any>(null);

  const { data: health } = useQuery({
    queryKey: ["health"],
    queryFn: api.getHealth,
  });

  const forgeUploadMutation = useMutation({
    mutationFn: ({
      fileBuffer,
      fileName,
    }: {
      fileBuffer: ArrayBuffer;
      fileName: string;
    }) => api.forgeUpload(fileBuffer, fileName),
    onSuccess: (result) => {
      setForgeResult(result);
      toast.success("File uploaded to Forge successfully");
    },
    onError: (error: any) => {
      toast.error(error?.error || "Forge upload failed");
    },
  });

  const forgeTranslateMutation = useMutation({
    mutationFn: ({
      objectId,
      fileName,
    }: {
      objectId: string;
      fileName: string;
    }) => api.forgeTranslate(objectId, fileName),
    onSuccess: (result) => {
      setTranslationResult(result);
      toast.success("Translation job started");
    },
    onError: (error: any) => {
      toast.error(error?.error || "Translation failed");
    },
  });

  const handleUploadSuccess = async (file: any) => {
    setUploadedFile(file);

    // Automatically process with Forge if health check passes
    if (health?.ok) {
      try {
        // For demo purposes, create a mock file buffer
        const mockBuffer = new ArrayBuffer(1024);

        // Upload to Forge
        forgeUploadMutation.mutate({
          fileBuffer: mockBuffer,
          fileName: file.original_name,
        });
      } catch (error) {
        toast.error("Failed to process with Forge");
      }
    } else {
      toast.error("System not healthy, skipping Forge processing");
    }
  };

  const handleUploadError = (error: string) => {
    toast.error(error);
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

      {/* System Health Warning */}
      {!health?.ok && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                System Warning
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  System is not healthy. Forge processing may not work
                  correctly.
                </p>
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
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <h4 className="font-medium text-gray-900">File Uploaded</h4>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <strong>Name:</strong> {uploadedFile.original_name}
                </p>
                <p>
                  <strong>Size:</strong>{" "}
                  {(uploadedFile.file_size / 1024 / 1024).toFixed(2)} MB
                </p>
                <p>
                  <strong>Type:</strong> {uploadedFile.file_type}
                </p>
                {uploadedFile.url && (
                  <p>
                    <strong>URL:</strong> {uploadedFile.url}
                  </p>
                )}
              </div>
            </div>

            {forgeUploadMutation.isPending && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-600">
                    Uploading to Forge...
                  </span>
                </div>
              </div>
            )}

            {forgeResult && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="h-5 w-5 text-green-500" />
                  <h4 className="font-medium text-gray-900">Forge Upload</h4>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <strong>Object ID:</strong> {forgeResult.objectId}
                  </p>
                  <p>
                    <strong>Bucket:</strong> {forgeResult.bucketKey}
                  </p>
                  <p>
                    <strong>Size:</strong> {forgeResult.size} bytes
                  </p>
                </div>

                {!forgeTranslateMutation.isPending && !translationResult && (
                  <button
                    onClick={() =>
                      forgeTranslateMutation.mutate({
                        objectId: forgeResult.objectId,
                        fileName: uploadedFile.original_name,
                      })
                    }
                    className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Start Translation
                  </button>
                )}
              </div>
            )}

            {forgeTranslateMutation.isPending && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-600">
                    Starting translation job...
                  </span>
                </div>
              </div>
            )}

            {translationResult && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="h-5 w-5 text-purple-500" />
                  <h4 className="font-medium text-gray-900">Translation Job</h4>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <strong>URN:</strong> {translationResult.urn}
                  </p>
                  <p>
                    <strong>Status:</strong> {translationResult.status}
                  </p>
                  <p>
                    <strong>Progress:</strong> {translationResult.progress}
                  </p>
                </div>

                {translationResult.status === "success" && (
                  <div className="mt-3">
                    <button
                      onClick={openViewer}
                      className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 flex items-center space-x-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>Open Viewer</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {forgeUploadMutation.error && (
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <h4 className="font-medium text-red-900">
                    Forge Upload Error
                  </h4>
                </div>
                <p className="mt-1 text-sm text-red-700">
                  {(forgeUploadMutation.error as any)?.error || "Upload failed"}
                </p>
              </div>
            )}

            {forgeTranslateMutation.error && (
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <h4 className="font-medium text-red-900">
                    Translation Error
                  </h4>
                </div>
                <p className="mt-1 text-sm text-red-700">
                  {(forgeTranslateMutation.error as any)?.error ||
                    "Translation failed"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
