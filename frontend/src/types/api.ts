export interface HealthResponse {
  ok: boolean;
  uptime: number;
  version: string;
  timestamp: string;
  environment: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  status?: string;
  files?: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
  }>;
}

export interface ApiFile {
  id: string;
  filename?: string;
  original_name: string;
  file_path?: string;
  file_size: number;
  file_type?: string;
  mime_type?: string;
  created_at: string;
  status?: string;
}

export interface FileStats {
  total: number;
  totalFiles: number;
  totalSize: number;
  byType: Record<string, number>;
}

export interface ForgeAuthResponse {
  token: string;
}

export interface ForgeUploadResponse {
  objectId: string;
  bucketKey: string;
  objectKey: string;
  size: number;
  location: string;
}

export interface ForgeTranslationResponse {
  urn: string;
  status: string;
  progress: string;
  output: {
    destination: {
      region: string;
    };
    formats: Array<{
      type: string;
      views: string[];
    }>;
  };
}

export interface ForgeManifestResponse {
  status: string;
  progress: string;
  version: string;
  region: string;
}

export interface ForgePropertiesResponse {
  areas: number[];
  lengths: number[];
  volumes: number[];
  counts: number[];
}

export interface QBHealthResponse {
  ok: boolean;
  connected: boolean;
  message: string;
  configured: boolean;
}
