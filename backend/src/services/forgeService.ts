import { httpClient } from '../infra/http.js';
import { createForgeCircuitBreaker } from '../infra/breaker.js';
import { config } from '../infra/config.js';
import { logger } from '../infra/logger.js';
import { toBase64Url } from '../utils/base64url.js';
import { createError } from '../api/middleware/errorHandler.js';
import {
  ForgeUploadData,
  ForgeTranslateData,
  ForgeUploadResult,
  ForgeTranslationResult,
} from '../types/files.js';

export class ForgeService {
  private accessToken: string | null = null;
  private tokenExpiry: number | null = null;

  constructor() {
    if (!config.FORGE_CLIENT_ID || !config.FORGE_CLIENT_SECRET) {
      logger.warn('FORGE_CLIENT_ID or FORGE_CLIENT_SECRET not configured');
    }
  }

  private async authenticate(requestId?: string): Promise<string> {
    const childLogger = logger.child({ requestId, service: 'forge' });

    if (!config.FORGE_CLIENT_ID || !config.FORGE_CLIENT_SECRET) {
      throw createError('FORGE_CLIENT_ID/SECRET missing', 400);
    }

    try {
      childLogger.debug('Authenticating with Forge');

      const form = new URLSearchParams({
        client_id: config.FORGE_CLIENT_ID,
        client_secret: config.FORGE_CLIENT_SECRET,
        grant_type: 'client_credentials',
        scope: 'data:read data:write data:create bucket:create bucket:read viewables:read',
      });

      const response = await httpClient.post(
        `${config.FORGE_BASE_URL}/authentication/v2/token`,
        form,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + response.data.expires_in * 1000;

      if (!this.accessToken) {
        throw new Error('No access token received from Forge');
      }

      childLogger.info('Forge authentication successful');
      return this.accessToken;
    } catch (error) {
      childLogger.error({ error: (error as Error).message }, 'Forge authentication failed');
      throw createError('Failed to authenticate with Autodesk Forge', 500);
    }
  }

  private async ensureValidToken(requestId?: string): Promise<string> {
    if (!this.accessToken || !this.tokenExpiry || Date.now() > this.tokenExpiry) {
      await this.authenticate(requestId);
    }
    if (!this.accessToken) {
      throw createError('Failed to obtain access token', 500);
    }
    return this.accessToken;
  }

  private async ensureBucket(requestId?: string): Promise<string> {
    const childLogger = logger.child({ requestId, service: 'forge' });
    const bucketKey = config.FORGE_BUCKET;

    if (!bucketKey) {
      throw createError('FORGE_BUCKET not configured', 500);
    }

    try {
      await this.ensureValidToken(requestId);

      childLogger.debug({ bucketKey }, 'Ensuring Forge bucket exists');

      // Try to create bucket
      await httpClient.post(
        `${config.FORGE_BASE_URL}/oss/v2/buckets`,
        {
          bucketKey: bucketKey,
          policyKey: 'temporary',
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      childLogger.debug('Forge bucket created');
      return bucketKey;
    } catch (error: any) {
      // If bucket already exists (409), treat as success
      if (error.response?.status === 409) {
        childLogger.debug('Forge bucket already exists');
        return bucketKey;
      }
      childLogger.error({ error: error.message }, 'Failed to ensure Forge bucket');
      throw createError('Failed to ensure Forge bucket', 500);
    }
  }

  // Circuit breaker wrapped methods
  private async uploadFileToForge(
    fileBuffer: Buffer,
    fileName: string,
    requestId?: string,
  ): Promise<ForgeUploadResult> {
    const childLogger = logger.child({ requestId, service: 'forge' });

    try {
      await this.ensureValidToken(requestId);
      await this.ensureBucket(requestId);

      const bucketKey = config.FORGE_BUCKET;
      const objectKey = `uploads/${Date.now()}_${fileName}`;

      childLogger.debug({ bucketKey, objectKey }, 'Uploading file to Forge');

      const response = await httpClient.put(
        `${config.FORGE_BASE_URL}/oss/v2/buckets/${bucketKey}/objects/${objectKey}`,
        fileBuffer,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/octet-stream',
          },
        },
      );

      const result: ForgeUploadResult = {
        objectId: response.data.objectId,
        bucketKey: response.data.bucketKey,
        objectKey: response.data.objectKey,
        size: response.data.size,
        location: response.data.location,
      };

      childLogger.info({ objectId: result.objectId }, 'File uploaded to Forge successfully');
      return result;
    } catch (error) {
      childLogger.error({ error: (error as Error).message }, 'Failed to upload file to Forge');
      throw createError('Failed to upload file to Forge', 500);
    }
  }

  private async translateFileInForge(
    objectId: string,
    fileName: string,
    requestId?: string,
  ): Promise<ForgeTranslationResult> {
    const childLogger = logger.child({ requestId, service: 'forge' });

    try {
      await this.ensureValidToken(requestId);

      const urn = toBase64Url(objectId);

      childLogger.debug({ urn, objectId }, 'Starting Forge translation job');

      const response = await httpClient.post(
        `${config.FORGE_BASE_URL}/modelderivative/v2/designdata/job`,
        {
          input: {
            urn: urn,
          },
          output: {
            destination: {
              region: 'us',
            },
            formats: [
              {
                type: 'svf',
                views: ['2d', '3d'],
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const result: ForgeTranslationResult = {
        urn: urn,
        status: response.data.status,
        progress: response.data.progress,
        output: response.data.output,
      };

      childLogger.info({ urn, status: result.status }, 'Forge translation job started');
      return result;
    } catch (error) {
      childLogger.error(
        { error: (error as Error).message },
        'Failed to start Forge translation job',
      );
      throw createError('Failed to start Forge translation job', 500);
    }
  }

  private async getManifestFromForge(urn: string, requestId?: string): Promise<any> {
    const childLogger = logger.child({ requestId, service: 'forge' });

    try {
      await this.ensureValidToken(requestId);

      childLogger.debug({ urn }, 'Fetching Forge manifest');

      const response = await httpClient.get(
        `${config.FORGE_BASE_URL}/modelderivative/v2/designdata/${urn}/manifest`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        },
      );

      childLogger.debug('Forge manifest fetched successfully');
      return response.data;
    } catch (error) {
      childLogger.error({ error: (error as Error).message }, 'Failed to get Forge manifest');
      throw createError('Failed to get Forge manifest', 500);
    }
  }

  private async getPropertiesFromForge(urn: string, requestId?: string): Promise<any> {
    const childLogger = logger.child({ requestId, service: 'forge' });

    try {
      await this.ensureValidToken(requestId);

      childLogger.debug({ urn }, 'Fetching Forge properties');

      const response = await httpClient.get(
        `${config.FORGE_BASE_URL}/modelderivative/v2/designdata/${urn}/properties`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        },
      );

      childLogger.debug('Forge properties fetched successfully');
      return response.data;
    } catch (error) {
      childLogger.error({ error: (error as Error).message }, 'Failed to get Forge properties');
      throw createError('Failed to get Forge properties', 500);
    }
  }

  // Public methods with circuit breakers
  async uploadFile(data: ForgeUploadData, requestId?: string): Promise<ForgeUploadResult> {
    const childLogger = logger.child({ requestId, service: 'forge' });

    try {
      const fileBuffer = Buffer.from(data.fileBuffer, 'base64');

      const circuitBreaker = createForgeCircuitBreaker(this.uploadFileToForge.bind(this));
      const result = await circuitBreaker.fire(fileBuffer, data.fileName, requestId);

      childLogger.info({ objectId: result.objectId }, 'File upload completed');
      return result;
    } catch (error) {
      childLogger.error({ error: (error as Error).message }, 'File upload failed');
      throw error;
    }
  }

  async translateFile(
    data: ForgeTranslateData,
    requestId?: string,
  ): Promise<ForgeTranslationResult> {
    const childLogger = logger.child({ requestId, service: 'forge' });

    try {
      const circuitBreaker = createForgeCircuitBreaker(this.translateFileInForge.bind(this));
      const result = await circuitBreaker.fire(data.objectId, data.fileName, requestId);

      childLogger.info({ urn: result.urn }, 'File translation completed');
      return result;
    } catch (error) {
      childLogger.error({ error: (error as Error).message }, 'File translation failed');
      throw error;
    }
  }

  async getManifest(urn: string, requestId?: string): Promise<any> {
    const childLogger = logger.child({ requestId, service: 'forge' });

    try {
      const circuitBreaker = createForgeCircuitBreaker(this.getManifestFromForge.bind(this));
      const result = await circuitBreaker.fire(urn, requestId);

      childLogger.debug('Manifest retrieved successfully');
      return result;
    } catch (error) {
      childLogger.error({ error: (error as Error).message }, 'Failed to get manifest');
      throw error;
    }
  }

  async getProperties(urn: string, requestId?: string): Promise<any> {
    const childLogger = logger.child({ requestId, service: 'forge' });

    try {
      const circuitBreaker = createForgeCircuitBreaker(this.getPropertiesFromForge.bind(this));
      const result = await circuitBreaker.fire(urn, requestId);

      childLogger.debug('Properties retrieved successfully');
      return result;
    } catch (error) {
      childLogger.error({ error: (error as Error).message }, 'Failed to get properties');
      throw error;
    }
  }

  async getTakeoff(urn: string, requestId?: string): Promise<any> {
    // Stub implementation for now
    const childLogger = logger.child({ requestId, service: 'forge' });
    childLogger.debug({ urn }, 'Takeoff requested (stub implementation)');

    return {
      areas: [],
      lengths: [],
      volumes: [],
      counts: [],
    };
  }
}

export const forgeService = new ForgeService();
