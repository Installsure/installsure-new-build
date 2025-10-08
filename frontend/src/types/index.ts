export type ServiceStatus = {
  api: string;
  bim_processor: string;
  upload_service: string;
};

export type HealthPayload = {
  status: string;
  timestamp: string;
  version: string;
  services: ServiceStatus;
};

export type DashboardStats = {
  total_projects: number;
  total_uploads: number;
  pages_processed: number;
  avg_cost: number;
};

export type Estimation = {
  file: string;
  pages: number;
  assumptions: {
    base_cost_per_page: number;
    complexity_multiplier: number;
    tax_rate: number;
  };
  costs: {
    subtotal: number;
    taxes: number;
    total: number;
  };
  line_items: { name: string; qty: number; unit: string; unit_cost: number; amount: number }[];
};