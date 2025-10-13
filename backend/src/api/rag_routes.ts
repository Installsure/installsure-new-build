/**
 * RAG API Routes - Search, cite, and provenance endpoints
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { answer_with_citations } from '../services/rag/service';
import { index_document } from '../services/embeddings/pipeline';

interface SearchQuery {
  query: string;
  top_k?: number;
}

interface IndexBody {
  doc_id: string;
  content: string;
}

/**
 * Register RAG routes
 */
export async function registerRagRoutes(app: FastifyInstance) {
  // Search endpoint with RAG
  app.post<{ Body: SearchQuery }>(
    '/api/rag/search',
    {
      schema: {
        description: 'Search using RAG with citations and provenance',
        tags: ['rag'],
        body: {
          type: 'object',
          required: ['query'],
          properties: {
            query: { type: 'string', description: 'Search query' },
            top_k: { type: 'number', description: 'Number of results', default: 6 }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              answer: { type: ['string', 'null'] },
              citations: { type: 'array', items: { type: 'string' } },
              provenance: { type: 'object' },
              policy: { type: 'string' },
              meta: { type: 'object' }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: SearchQuery }>, reply: FastifyReply) => {
      const { query, top_k = 6 } = request.body;
      
      try {
        const result = await answer_with_citations(query, top_k);
        return reply.send(result);
      } catch (error) {
        request.log.error({ error }, 'RAG search failed');
        return reply.status(500).send({
          error: 'Search failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );
  
  // Index document endpoint
  app.post<{ Body: IndexBody }>(
    '/api/rag/index',
    {
      schema: {
        description: 'Index a document for RAG retrieval',
        tags: ['rag'],
        body: {
          type: 'object',
          required: ['doc_id', 'content'],
          properties: {
            doc_id: { type: 'string', description: 'Document identifier' },
            content: { type: 'string', description: 'Document content' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              doc_id: { type: 'string' },
              chunks_indexed: { type: 'number' }
            }
          }
        }
      }
    },
    async (request: FastifyRequest<{ Body: IndexBody }>, reply: FastifyReply) => {
      const { doc_id, content } = request.body;
      
      try {
        const chunks_count = await index_document(doc_id, content);
        
        return reply.send({
          success: true,
          doc_id,
          chunks_indexed: chunks_count
        });
      } catch (error) {
        request.log.error({ error }, 'Document indexing failed');
        return reply.status(500).send({
          error: 'Indexing failed',
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  );
  
  // Health check for RAG service
  app.get(
    '/api/rag/health',
    {
      schema: {
        description: 'RAG service health check',
        tags: ['rag'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              vectorstore: { type: 'string' },
              cache: { type: 'string' }
            }
          }
        }
      }
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // TODO: Check actual service health
      return reply.send({
        status: 'healthy',
        vectorstore: process.env.VECTORSTORE_URL ? 'configured' : 'not_configured',
        cache: process.env.REDIS_URL ? 'configured' : 'not_configured'
      });
    }
  );
}
