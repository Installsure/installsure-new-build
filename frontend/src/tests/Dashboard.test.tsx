import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';

// Mock the API
vi.mock('../lib/api', () => ({
  api: {
    getProjects: vi.fn().mockResolvedValue([
      {
        id: '1',
        name: 'Test Project',
        description: 'Test Description',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ]),
    getHealth: vi.fn().mockResolvedValue({
      ok: true,
      uptime: 3600,
      version: '1.0.0',
      timestamp: '2025-01-01T00:00:00Z',
      environment: 'test',
    }),
    getFileStats: vi.fn().mockResolvedValue({
      total: 5,
      totalFiles: 5,
      totalSize: 75497472,
      byType: {
        dwg: 2,
        rvt: 1,
        ifc: 1,
        pdf: 1,
      },
    }),
  },
}));

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>,
  );
};

describe('Dashboard', () => {
  it('renders dashboard title', async () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Welcome to InstallSure - Construction Management Platform')).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    renderWithProviders(<Dashboard />);
    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
  });
});