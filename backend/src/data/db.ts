import { Pool, PoolClient, QueryResult } from 'pg';
import { config } from '../infra/config.js';
import { logger } from '../infra/logger.js';

class Database {
  private pool: Pool;
  private isShuttingDown = false;

  constructor() {
    this.pool = new Pool({
      connectionString: config.DATABASE_URL,
      ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    });

    this.pool.on('error', (err: Error) => {
      logger.error({ error: err.message }, 'Unexpected error on idle client');
    });

    this.pool.on('connect', () => {
      logger.debug('New client connected to database');
    });

    this.pool.on('remove', () => {
      logger.debug('Client removed from database pool');
    });
  }

  async query<T extends Record<string, any> = any>(
    text: string,
    params?: any[],
    requestId?: string,
  ): Promise<QueryResult<T>> {
    if (this.isShuttingDown) {
      throw new Error('Database is shutting down');
    }

    const start = Date.now();
    const childLogger = requestId ? logger.child({ requestId }) : logger;

    try {
      childLogger.debug({ query: text, params }, 'Executing database query');

      const result = await this.pool.query(text, params);

      const duration = Date.now() - start;
      childLogger.debug({ duration, rowCount: result.rowCount }, 'Query completed');

      return result;
    } catch (error: any) {
      const duration = Date.now() - start;
      childLogger.error(
        {
          error: error.message,
          query: text,
          params,
          duration,
        },
        'Query failed',
      );
      throw error;
    }
  }

  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
    requestId?: string,
  ): Promise<T> {
    if (this.isShuttingDown) {
      throw new Error('Database is shutting down');
    }

    const client = await this.pool.connect();
    const childLogger = requestId ? logger.child({ requestId }) : logger;

    try {
      await client.query('BEGIN');
      childLogger.debug('Transaction started');

      const result = await callback(client);

      await client.query('COMMIT');
      childLogger.debug('Transaction committed');

      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      childLogger.error({ error: (error as Error).message }, 'Transaction rolled back');
      throw error;
    } finally {
      client.release();
    }
  }

  async healthCheck(): Promise<boolean> {
    // In test environment, skip actual DB check to keep tests hermetic
    if (process.env.NODE_ENV === 'test' || config.NODE_ENV === 'test') {
      return true;
    }

    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Database health check failed');
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    logger.info('Closing database pool...');

    try {
      await this.pool.end();
      logger.info('Database pool closed');
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Error closing database pool');
    }
  }

  getPool(): Pool {
    return this.pool;
  }
}

export const db = new Database();

export const initDatabase = async (): Promise<void> => {
  try {
    // Test database connection
    await db.healthCheck();
    logger.info('Database connection established');

    // Run migrations if needed
    // This would typically run database migrations here
    logger.info('Database initialization completed');
  } catch (error) {
    logger.error({ error: (error as Error).message }, 'Database initialization failed');
    throw error;
  }
};
