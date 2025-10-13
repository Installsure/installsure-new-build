# LLM/RAG/Governance Implementation Guide

## Overview

This guide documents the LLM/RAG/governance upgrades added to InstallSure's build process. These features enable semantic search, retrieval-augmented generation (RAG), and compliance enforcement.

## 🎯 What's Been Added

### 1. Makefile Build Targets

New `make` commands for managing the full development lifecycle:

```bash
make dev      # Bring up Postgres, Redis, backend, BIM worker, frontend
make seed     # Seed demo data + sample IFC + embeddings
make test     # Run pytest + Playwright + coverage gate
make llm      # Start vector DB, run embeddings pipeline, warm semantic cache
make scan     # Run bandit + SBOM + dependency scan
make release  # Build images + SLSA provenance
make clean    # Clean up containers, volumes, and build artifacts
```

### 2. New Folder Structure

```
backend/src/
├── services/
│   ├── rag/
│   │   ├── service.ts          # RAG with citations & provenance
│   │   └── store.ts            # Vector search interface
│   ├── embeddings/
│   │   └── pipeline.ts         # Embeddings generation & indexing
│   ├── semantic_cache/
│   │   └── cache.ts            # Redis-based semantic cache
│   └── metrics/
│       └── exporter.ts         # Observability metrics
├── api/
│   └── rag_routes.ts           # RAG API endpoints
└── evals/
    ├── groundedness.ts         # Groundedness evaluation (≥85% hit rate)
    └── latency.ts              # Latency evaluation (p95 ≤ 2.5s)

frontend/src/
├── components/
│   └── CitationsPanel.tsx      # Display sources for LLM responses
└── lib/
    └── semanticCacheBadge.ts   # Cache status utilities

backend/scripts/
└── seed_embeddings.py          # Seed sample documents for RAG

infra/compose/
└── docker-compose.llm.yml      # Vector DB services (pgvector, qdrant, weaviate)
```

### 3. Environment Variables

Add to `backend/.env`:

```bash
# LLM/RAG Configuration
VECTORSTORE_URL=postgresql+psycopg://installsure:password@localhost:5432/installsure
EMBEDDINGS_MODEL=openai/text-embedding-3-small
SEMANTIC_CACHE_TTL_SECONDS=3600
FACTUAL_REQUIRES_RETRIEVAL=true
```

### 4. Vector Database Setup

The system supports multiple vector stores:

- **pgvector** (default): PostgreSQL extension for vector embeddings
- **Qdrant**: Dedicated vector search engine (optional)
- **Weaviate**: AI-native vector database (optional)

To use pgvector:
```bash
make llm  # Automatically sets up pgvector
```

To use alternative vector stores:
```bash
docker-compose -f docker-compose.yml -f infra/compose/docker-compose.llm.yml --profile qdrant up
# or
docker-compose -f docker-compose.yml -f infra/compose/docker-compose.llm.yml --profile weaviate up
```

## 🚀 Getting Started

### Quick Start

1. **Start the LLM stack:**
   ```bash
   make llm
   ```

2. **Seed embeddings:**
   ```bash
   SEED=true python3 backend/scripts/seed_embeddings.py
   ```

3. **Start development environment:**
   ```bash
   make dev
   ```

4. **Run tests and evaluations:**
   ```bash
   make test
   ```

### Using RAG Endpoints

#### Search with Citations

```bash
curl -X POST http://localhost:8080/api/rag/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the safety requirements?",
    "top_k": 6
  }'
```

Response:
```json
{
  "answer": "Based on the safety requirements document...",
  "citations": ["safety_requirements"],
  "provenance": {
    "rag": [
      {
        "doc_id": "safety_requirements",
        "chunk_id": "safety_requirements_chunk_0",
        "content": "...",
        "score": 0.92
      }
    ]
  },
  "meta": {
    "cached": false
  }
}
```

#### Index a Document

```bash
curl -X POST http://localhost:8080/api/rag/index \
  -H "Content-Type: application/json" \
  -d '{
    "doc_id": "project_spec_001",
    "content": "Full project specification content..."
  }'
```

## 🧪 Testing & Evaluation

### Run Groundedness Evaluation

Tests that RAG retrieval meets quality thresholds (≥85% hit rate):

```bash
cd backend
npx tsx src/evals/groundedness.ts
```

### Run Latency Evaluation

Tests that RAG API meets performance SLOs (p95 ≤ 2.5s):

```bash
cd backend
npx tsx src/evals/latency.ts
```

### Coverage Requirements

The CI/CD pipeline enforces ≥80% test coverage:

```bash
cd backend
npm run test:coverage
```

## 🔒 Security & Compliance

### Security Scanning

Run security scans with:

```bash
make scan
```

This runs:
- **Bandit** for Python security issues
- **SBOM generation** with Syft
- **NPM audit** for Node.js dependencies

### CI/CD Gates

The GitHub Actions pipeline enforces these gates:

1. **Lint & Type Check**: ESLint, TypeScript, Ruff
2. **Tests**: Jest, Vitest with ≥80% coverage
3. **Security**: Bandit, npm audit
4. **Evaluations**:
   - Groundedness: ≥85% retrieval hit rate
   - Latency: p95 ≤ 2.5s
5. **SBOM**: Automatic generation on releases

### SLSA Provenance

Build images with provenance:

```bash
make release
```

## 📊 Observability & Metrics

### Metrics Tracking

The metrics exporter tracks:
- Token usage
- Retrieval operations
- Cache hit rate
- Request latency (avg, p95)

```typescript
import { metricsExporter } from './services/metrics/exporter';

// Track metrics
metricsExporter.trackTokens(150);
metricsExporter.trackRetrieval();
metricsExporter.trackCacheHit();
metricsExporter.trackLatency(234);

// View metrics
metricsExporter.log();
```

### Budget Alerts

Configure budget thresholds in `backend/src/services/metrics/exporter.ts`:

```typescript
export const BUDGET_THRESHOLDS = {
  weekly_token_limit: 1_000_000,
  weekly_cost_limit_usd: 100
};
```

## 🎨 Frontend Integration

### Using CitationsPanel

```tsx
import CitationsPanel from './components/CitationsPanel';

function SearchResults({ response }) {
  return (
    <div>
      <p>{response.answer}</p>
      <CitationsPanel items={response.citations.map(id => ({
        id,
        title: `Document ${id}`,
        href: `/documents/${id}`
      }))} />
    </div>
  );
}
```

### Using Semantic Cache Badge

```tsx
import { formatCacheInfo, getCacheBadgeColor } from './lib/semanticCacheBadge';

function ResponseBadge({ meta }) {
  const color = getCacheBadgeColor(meta?.cached);
  const label = formatCacheInfo(meta);
  
  return (
    <span className={`badge ${color}`}>
      {label}
    </span>
  );
}
```

## 🛠️ VS Code Integration

Use VS Code tasks (Ctrl+Shift+P → "Run Task"):

- **Dev: Bootstrap** - Start complete dev environment
- **LLM: Up & Seed** - Start LLM stack and seed data
- **Test: All** - Run all tests and evaluations
- **Security: Scan** - Run security scans
- **Eval: Groundedness** - Run groundedness evaluation
- **Eval: Latency** - Run latency evaluation

## 📝 PowerShell Commands

For Windows users, all `make` commands can be run via PowerShell:

```powershell
# Start LLM stack
docker compose -f docker-compose.yml -f infra/compose/docker-compose.llm.yml up -d
cd backend && npx prisma migrate dev

# Seed embeddings
$env:SEED="true"
python backend/scripts/seed_embeddings.py

# Run tests
cd backend && npm run test:coverage
cd ../frontend && npm test

# Security scan
pip install bandit
bandit -r bim/ backend/scripts/
cd backend && npm audit
cd ../frontend && npm audit
```

## 🔄 Architecture

```
┌─────────────┐
│   Frontend  │──┐
└─────────────┘  │
                 │
┌─────────────┐  │  ┌──────────────┐
│   Backend   │◄─┴─►│  RAG Service │
│     API     │     └──────────────┘
└─────────────┘            │
       │                   │
       ├───────────────────┤
       │                   │
   ┌───▼────┐       ┌─────▼────────┐
   │ Redis  │       │   pgvector   │
   │ Cache  │       │ Vector Store │
   └────────┘       └──────────────┘
```

## 📚 Next Steps

1. **Implement Actual Embeddings**: Replace stub implementations with real embeddings API
2. **Add Vector DB Migrations**: Create Alembic migrations for pgvector tables
3. **Implement LLM Integration**: Connect to OpenAI or local LLM for answer generation
4. **Add More Test Cases**: Expand groundedness and latency test suites
5. **Configure Playwright**: Add E2E tests for RAG UI components
6. **Set Up SLSA**: Configure actual SLSA provenance generation

## 🤝 Contributing

When adding LLM/RAG features:

1. Update evaluations in `backend/src/evals/`
2. Add tests to maintain ≥80% coverage
3. Update metrics tracking
4. Document new endpoints in this guide
5. Run `make scan` before committing

## 📖 References

- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Retrieval-Augmented Generation](https://arxiv.org/abs/2005.11401)
- [SLSA Framework](https://slsa.dev/)
- [Bandit Security Scanner](https://bandit.readthedocs.io/)
