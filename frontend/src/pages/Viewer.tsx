import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { FileText, ExternalLink, AlertCircle, Loader2 } from "lucide-react";

export default function Viewer() {
  const { urn } = useParams<{ urn: string }>();

  const {
    data: manifest,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["manifest", urn],
    queryFn: () => api.getManifest(urn!),
    enabled: !!urn,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading model manifest...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{(error as any)?.error || "Failed to load model manifest"}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">3D Model Viewer</h1>
        <p className="mt-1 text-sm text-gray-600">URN: {urn}</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Model Status</h3>

        {manifest ? (
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="h-5 w-5 text-blue-500" />
                <h4 className="font-medium text-gray-900">Manifest Data</h4>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <strong>Status:</strong> {manifest.status}
                </p>
                <p>
                  <strong>Progress:</strong> {manifest.progress}
                </p>
                {manifest.version && (
                  <p>
                    <strong>Version:</strong> {manifest.version}
                  </p>
                )}
                {manifest.region && (
                  <p>
                    <strong>Region:</strong> {manifest.region}
                  </p>
                )}
              </div>
            </div>

            <div className="text-center">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
                <div className="mx-auto h-12 w-12 text-blue-400 mb-4">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  3D Viewer Placeholder
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  The actual Forge Viewer would be integrated here
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() =>
                      window.open(
                        `https://viewer.autodesk.com/viewer?urn=${urn}`,
                        "_blank",
                      )
                    }
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center space-x-2 mx-auto"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Open in Forge Viewer</span>
                  </button>
                  <p className="text-xs text-gray-400">
                    This will open the model in the official Autodesk Forge
                    Viewer
                  </p>
                </div>
              </div>
            </div>

            {/* Raw manifest data for debugging */}
            <details className="border rounded-lg p-4">
              <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                Raw Manifest Data
              </summary>
              <pre className="mt-2 text-xs text-gray-600 bg-gray-50 p-3 rounded overflow-auto max-h-64">
                {JSON.stringify(manifest, null, 2)}
              </pre>
            </details>
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>No manifest data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
