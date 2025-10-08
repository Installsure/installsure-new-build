import React, { useState, useEffect } from "react";
import { api } from "../lib/api";

export default function Settings() {
  const [health, setHealth] = useState<any>(null);
  const [qbHealth, setQbHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    try {
      const [healthData, qbData] = await Promise.all([
        api.getHealth(),
        api.getQBHealth(),
      ]);

      setHealth(healthData);
      setQbHealth(qbData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshHealth = () => {
    setLoading(true);
    loadHealthData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          System configuration and health status
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">System Health</h3>
            <button
              onClick={refreshHealth}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">
                Backend API
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  health?.ok
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {health?.ok ? "Healthy" : "Unhealthy"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">
                QuickBooks
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  qbHealth?.connected
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {qbHealth?.connected ? "Connected" : "Not Connected"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Environment Variables
          </h3>

          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">
                API Base URL:
              </span>
              <span className="ml-2 text-sm text-gray-900">
                {(import.meta as any).env?.VITE_API_BASE ||
                  "http://localhost:8000"}
              </span>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-500">
                Sentry DSN:
              </span>
              <span className="ml-2 text-sm text-gray-900">
                {(import.meta as any).env?.VITE_SENTRY_DSN
                  ? "Configured"
                  : "Not configured"}
              </span>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-500">
                Environment:
              </span>
              <span className="ml-2 text-sm text-gray-900">
                {(import.meta as any).env?.MODE || "development"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Integration Status
        </h3>

        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">
                  AutoCAD/Forge Integration
                </h4>
                <p className="text-sm text-gray-600">
                  BIM model processing and viewing
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Requires Configuration
              </span>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">
                  QuickBooks Integration
                </h4>
                <p className="text-sm text-gray-600">
                  Accounting and invoicing
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Requires Configuration
              </span>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Sentry Monitoring</h4>
                <p className="text-sm text-gray-600">
                  Error tracking and performance monitoring
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Optional
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Configuration Required
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                To enable full functionality, configure the following
                environment variables:
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>
                  FORGE_CLIENT_ID and FORGE_CLIENT_SECRET for AutoCAD
                  integration
                </li>
                <li>
                  QB_CLIENT_ID and QB_CLIENT_SECRET for QuickBooks integration
                </li>
                <li>VITE_SENTRY_DSN for error monitoring (optional)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
