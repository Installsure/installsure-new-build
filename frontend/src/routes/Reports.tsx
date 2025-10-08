import React, { useState, useEffect } from "react";
import { api } from "../lib/api";

export default function Reports() {
  const [takeoffData, setTakeoffData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urn, setUrn] = useState("");

  const loadTakeoff = async () => {
    if (!urn.trim()) {
      setError("Please enter a URN");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await api.getTakeoff(urn);
      setTakeoffData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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

        <div className="space-y-4">
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
                onClick={loadTakeoff}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Generate"}
              </button>
            </div>
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

          {takeoffData && (
            <div className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">
                Takeoff Results
              </h4>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Areas:
                    </span>
                    <span className="ml-2 text-sm text-gray-900">
                      {takeoffData.areas?.length || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Lengths:
                    </span>
                    <span className="ml-2 text-sm text-gray-900">
                      {takeoffData.lengths?.length || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Volumes:
                    </span>
                    <span className="ml-2 text-sm text-gray-900">
                      {takeoffData.volumes?.length || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Counts:
                    </span>
                    <span className="ml-2 text-sm text-gray-900">
                      {takeoffData.counts?.length || 0}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    Raw Data:
                  </h5>
                  <pre className="text-xs text-gray-600 bg-gray-50 p-3 rounded overflow-auto max-h-64">
                    {JSON.stringify(takeoffData, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Report Templates
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
            <h4 className="font-medium text-gray-900">Quantity Takeoff</h4>
            <p className="text-sm text-gray-600 mt-1">
              Generate detailed quantity reports
            </p>
          </div>
          <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
            <h4 className="font-medium text-gray-900">Cost Estimation</h4>
            <p className="text-sm text-gray-600 mt-1">
              Calculate project costs from quantities
            </p>
          </div>
          <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
            <h4 className="font-medium text-gray-900">Progress Report</h4>
            <p className="text-sm text-gray-600 mt-1">
              Track project progress and milestones
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
