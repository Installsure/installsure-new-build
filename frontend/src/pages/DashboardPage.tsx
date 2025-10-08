import React from 'react';

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Active Projects</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">12</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Open RFIs</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">8</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Pending Tasks</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">24</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Completed Tasks</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">156</p>
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="text-sm text-gray-600">RFI #123 submitted for Project Alpha</div>
            <div className="text-sm text-gray-600">Task "Install HVAC" completed</div>
            <div className="text-sm text-gray-600">New project "Beta Construction" created</div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Deadlines</h3>
          <div className="space-y-3">
            <div className="text-sm text-gray-600">Project Alpha - Phase 2 due in 3 days</div>
            <div className="text-sm text-gray-600">RFI Response due in 5 days</div>
            <div className="text-sm text-gray-600">Inspection scheduled in 1 week</div>
          </div>
        </div>
      </div>
    </div>
  );
}