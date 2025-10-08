import React, { useState, useEffect } from "react";
import { Building2, FileText, AlertCircle, TrendingUp } from "lucide-react";

export default function DebugDashboard() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testConnections = async () => {
      const info: any = {};

      try {
        // Test backend health
        console.log("Testing backend health...");
        const healthResponse = await fetch("http://localhost:8000/api/health");
        const healthData = await healthResponse.json();
        info.backendHealth = {
          status: healthResponse.status,
          ok: healthResponse.ok,
          data: healthData,
        };
        console.log("Backend health:", healthData);
      } catch (err) {
        console.error("Backend health error:", err);
        info.backendHealth = {
          error: err instanceof Error ? err.message : String(err),
        };
      }

      try {
        // Test projects API
        console.log("Testing projects API...");
        const projectsResponse = await fetch(
          "http://localhost:8000/api/projects",
        );
        const projectsData = await projectsResponse.json();
        info.projects = {
          status: projectsResponse.status,
          ok: projectsResponse.ok,
          data: projectsData,
        };
        console.log("Projects API:", projectsData);
      } catch (err) {
        console.error("Projects API error:", err);
        info.projects = {
          error: err instanceof Error ? err.message : String(err),
        };
      }

      setDebugInfo(info);
      setLoading(false);
    };

    testConnections();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4">Testing connections...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          InstallSure Debug Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Connection testing and debugging information
        </p>
      </div>

      {/* Backend Health */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Backend Health Check
        </h3>
        {debugInfo.backendHealth?.error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Connection Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{debugInfo.backendHealth.error}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`p-4 rounded-md ${debugInfo.backendHealth?.ok ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
          >
            <div className="flex items-center">
              <div
                className={`w-2 h-2 rounded-full ${debugInfo.backendHealth?.ok ? "bg-green-500" : "bg-red-500"}`}
              />
              <span className="ml-2 text-sm font-medium">
                {debugInfo.backendHealth?.ok ? "Connected" : "Failed"}
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <p>Status: {debugInfo.backendHealth?.status}</p>
              <p>
                Uptime:{" "}
                {debugInfo.backendHealth?.data?.uptime
                  ? Math.floor(debugInfo.backendHealth.data.uptime / 60) +
                    " minutes"
                  : "Unknown"}
              </p>
              <p>
                Version: {debugInfo.backendHealth?.data?.version || "Unknown"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Projects API */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Projects API Test
        </h3>
        {debugInfo.projects?.error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">API Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{debugInfo.projects.error}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`p-4 rounded-md ${debugInfo.projects?.ok ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
          >
            <div className="flex items-center">
              <div
                className={`w-2 h-2 rounded-full ${debugInfo.projects?.ok ? "bg-green-500" : "bg-red-500"}`}
              />
              <span className="ml-2 text-sm font-medium">
                {debugInfo.projects?.ok ? "API Working" : "API Failed"}
              </span>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <p>Status: {debugInfo.projects?.status}</p>
              <p>Success: {debugInfo.projects?.data?.success ? "Yes" : "No"}</p>
              <p>Projects Count: {debugInfo.projects?.data?.count || 0}</p>
              {debugInfo.projects?.data?.data && (
                <div className="mt-2">
                  <p className="font-medium">Projects:</p>
                  <ul className="list-disc list-inside">
                    {debugInfo.projects.data.data.map(
                      (project: any, index: number) => (
                        <li key={index}>
                          {project.name} ({project.status})
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Raw Debug Data */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Raw Debug Data
        </h3>
        <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      {/* Action Buttons */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
        <div className="flex space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Refresh Test
          </button>
          <button
            onClick={() =>
              window.open("http://localhost:8000/api/health", "_blank")
            }
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Open Backend API
          </button>
          <button
            onClick={() =>
              window.open("http://localhost:8000/api/projects", "_blank")
            }
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            Open Projects API
          </button>
        </div>
      </div>
    </div>
  );
}
