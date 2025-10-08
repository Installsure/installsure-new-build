import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { toast } from "react-hot-toast";
import { FileText, Download, AlertCircle, Loader2 } from "lucide-react";

export default function Reports() {
  const [urn, setUrn] = useState("");

  const {
    data: takeoffData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["takeoff", urn],
    queryFn: () => api.getTakeoff(urn),
    enabled: !!urn,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urn.trim()) {
      toast.error("Please enter a URN");
      return;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Takeoffs</h1>
        <p className="mt-1 text-sm text-gray-600">
          Generate quantity takeoffs and reports from your BIM models
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Generate Takeoff Report
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="urn"
              className="block text-sm font-medium text-gray-700"
            >
              Model URN
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                name="urn"
                id="urn"
                value={urn}
                onChange={(e) => setUrn(e.target.value)}
                className="flex-1 min-w-0 block w-full px-3 py-2 border border-gray-300 rounded-none rounded-l-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter model URN..."
              />
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Generate"
                )}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{(error as any)?.error || "Failed to generate takeoff"}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {takeoffData && (
          <div className="mt-6 border rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="h-5 w-5 text-green-500" />
              <h4 className="font-medium text-gray-900">Takeoff Results</h4>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-500">Areas</div>
                <div className="text-2xl font-bold text-gray-900">
                  {takeoffData.areas?.length || 0}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-500">Lengths</div>
                <div className="text-2xl font-bold text-gray-900">
                  {takeoffData.lengths?.length || 0}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-500">Volumes</div>
                <div className="text-2xl font-bold text-gray-900">
                  {takeoffData.volumes?.length || 0}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-500">Counts</div>
                <div className="text-2xl font-bold text-gray-900">
                  {takeoffData.counts?.length || 0}
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => {
                  const dataStr = JSON.stringify(takeoffData, null, 2);
                  const dataBlob = new Blob([dataStr], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `takeoff-${urn}-${Date.now()}.json`;
                  link.click();
                  URL.revokeObjectURL(url);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Download JSON</span>
              </button>
            </div>

            <details className="mt-4">
              <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                Raw Data
              </summary>
              <pre className="mt-2 text-xs text-gray-600 bg-gray-50 p-3 rounded overflow-auto max-h-64">
                {JSON.stringify(takeoffData, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Report Templates
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <h4 className="font-medium text-gray-900">Quantity Takeoff</h4>
            </div>
            <p className="text-sm text-gray-600">
              Generate detailed quantity reports
            </p>
          </div>

          <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="h-5 w-5 text-green-500" />
              <h4 className="font-medium text-gray-900">Cost Estimation</h4>
            </div>
            <p className="text-sm text-gray-600">
              Calculate project costs from quantities
            </p>
          </div>

          <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="h-5 w-5 text-purple-500" />
              <h4 className="font-medium text-gray-900">Progress Report</h4>
            </div>
            <p className="text-sm text-gray-600">
              Track project progress and milestones
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
