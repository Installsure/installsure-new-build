import React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { flags } from "../lib/flags.js";
import {
  Settings as SettingsIcon,
  Database,
  Zap,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

export default function Settings() {
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ["health"],
    queryFn: api.getHealth,
    refetchInterval: 30000,
  });

  const { data: qbHealth, isLoading: qbLoading } = useQuery({
    queryKey: ["qbHealth"],
    queryFn: api.getQBHealth,
    refetchInterval: 30000,
  });

  if (healthLoading || qbLoading) {
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* System Health */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <SettingsIcon className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-medium text-gray-900">System Health</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">
                Backend API
              </span>
              <div className="flex items-center space-x-2">
                {health?.ok ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span
                  className={`text-sm font-medium ${
                    health?.ok ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {health?.ok ? "Healthy" : "Unhealthy"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">
                QuickBooks
              </span>
              <div className="flex items-center space-x-2">
                {qbHealth?.connected ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
                <span
                  className={`text-sm font-medium ${
                    qbHealth?.connected ? "text-green-600" : "text-yellow-600"
                  }`}
                >
                  {qbHealth?.connected ? "Connected" : "Not Connected"}
                </span>
              </div>
            </div>

            {health && (
              <div className="text-sm text-gray-500">
                <p>Uptime: {Math.floor(health.uptime / 60)} minutes</p>
                <p>Version: {health.version}</p>
                <p>Environment: {health.environment}</p>
              </div>
            )}
          </div>
        </div>

        {/* Environment Variables */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Database className="h-5 w-5 text-green-500" />
            <h3 className="text-lg font-medium text-gray-900">Environment</h3>
          </div>

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
                {flags.sentry.enabled ? "Configured" : "Not configured"}
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

      {/* Integration Status */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Zap className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-medium text-gray-900">
            Integration Status
          </h3>
        </div>

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
              <div className="flex items-center space-x-2">
                {flags.forge.enabled ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                <span
                  className={`text-sm font-medium ${
                    flags.forge.enabled ? "text-green-600" : "text-yellow-600"
                  }`}
                >
                  {flags.forge.enabled ? "Enabled" : "Requires Configuration"}
                </span>
              </div>
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
              <div className="flex items-center space-x-2">
                {flags.quickbooks.enabled ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                <span
                  className={`text-sm font-medium ${
                    flags.quickbooks.enabled
                      ? "text-green-600"
                      : "text-yellow-600"
                  }`}
                >
                  {flags.quickbooks.enabled
                    ? "Enabled"
                    : "Requires Configuration"}
                </span>
              </div>
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
              <div className="flex items-center space-x-2">
                {flags.sentry.enabled ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-gray-500" />
                )}
                <span
                  className={`text-sm font-medium ${
                    flags.sentry.enabled ? "text-green-600" : "text-gray-600"
                  }`}
                >
                  {flags.sentry.enabled ? "Enabled" : "Optional"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Help */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <SettingsIcon className="h-5 w-5 text-blue-400" />
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
