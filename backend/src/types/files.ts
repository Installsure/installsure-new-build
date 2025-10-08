export interface File {
  id: number;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  created_at: Date;
}

export interface CreateFileData {
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
}

export interface ForgeUploadData {
  fileBuffer: string; // base64 encoded
  fileName: string;
}

export interface ForgeTranslateData {
  objectId: string;
  fileName: string;
}

export interface ForgeUploadResult {
  objectId: string;
  bucketKey: string;
  objectKey: string;
  size: number;
  location: string;
}

export interface ForgeTranslationResult {
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
