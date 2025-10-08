import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from './logger.js';
import { config } from './config.js';

class RetryableHttpClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      timeout: 12000, // 12 seconds
      maxRedirects: 0,
      headers: {
        'User-Agent': 'InstallSure/1.0.0',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        logger.debug({ url: config.url, method: config.method }, 'HTTP request');
        return config;
      },
      (error) => {
        logger.error({ error: error.message }, 'HTTP request error');
        return Promise.reject(error);
      },
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(
          {
            url: response.config.url,
            method: response.config.method,
            status: response.status,
          },
          'HTTP response',
        );
        return response;
      },
      (error) => {
        logger.error(
          {
            url: error.config?.url,
            method: error.config?.method,
            status: error.response?.status,
            error: error.message,
          },
          'HTTP response error',
        );
        return Promise.reject(error);
      },
    );
  }

  async request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.retryWithBackoff(config);
  }

  private async retryWithBackoff<T>(
    config: AxiosRequestConfig,
    maxRetries: number = 2,
    baseDelay: number = 400,
  ): Promise<AxiosResponse<T>> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.client.request<T>(config);
      } catch (error: any) {
        lastError = error;

        // Don't retry on 4xx errors except 408 (timeout) and 429 (rate limit)
        if (error.response?.status >= 400 && error.response?.status < 500) {
          if (error.response.status !== 408 && error.response.status !== 429) {
            throw error;
          }
        }

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = baseDelay * Math.pow(2, attempt);
        logger.warn(
          {
            attempt: attempt + 1,
            maxRetries,
            delay,
            error: error.message,
            status: error.response?.status,
          },
          'HTTP request failed, retrying',
        );

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }
}

export const httpClient = new RetryableHttpClient();
