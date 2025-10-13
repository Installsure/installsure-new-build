# 🏛️ InstallSure Architecture Documentation

## 📋 Table of Contents
- [System Overview](#system-overview)
- [3-Tier Development Architecture](#3-tier-development-architecture)
- [Technical Architecture](#technical-architecture)
- [Data Flow](#data-flow)
- [Security Architecture](#security-architecture)
- [Deployment Architecture](#deployment-architecture)

---

## 🌐 System Overview

InstallSure is an enterprise construction management platform built with a modern microservices architecture. The system consists of three main services working together:

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                         InstallSure Platform                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Frontend   │  │   Backend    │  │  BIM Service │          │
│  │   React/TS   │◄─┤  Node.js/TS  │◄─┤  Python/API  │          │
│  │   Port 5173  │  │  Port 8080   │  │  Port 8000   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                  │
│         │                  │                  │                  │
│         └──────────────────┼──────────────────┘                  │
│                            │                                     │
│                  ┌─────────┴─────────┐                          │
│                  │                   │                          │
│          ┌───────▼──────┐    ┌──────▼──────┐                   │
│          │  PostgreSQL  │    │    Redis    │                   │
│          │  Database    │    │    Cache    │                   │
│          └──────────────┘    └─────────────┘                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🤝 3-Tier Development Architecture

### Organizational Structure

```
┌────────────────────────────────────────────────────────────────┐
│                   InstallSure Development Team                  │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Tier 1: Infrastructure Layer (VS Code Focus)          │   │
│  │  ─────────────────────────────────────────────────     │   │
│  │  • Project Structure & Organization                    │   │
│  │  • Build & Tooling Configuration                       │   │
│  │  • Docker & Deployment Setup                           │   │
│  │  • Database Schema & Migrations                        │   │
│  │  • CI/CD Pipeline                                      │   │
│  └────────────────────────────────────────────────────────┘   │
│                            │                                    │
│                            ▼                                    │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Tier 2: Implementation Layer (Cursor Focus)           │   │
│  │  ──────────────────────────────────────────────        │   │
│  │  • Feature Development                                 │   │
│  │  • API Endpoints & Business Logic                      │   │
│  │  • UI Components & Pages                               │   │
│  │  • State Management                                    │   │
│  │  • Unit & Integration Tests                            │   │
│  └────────────────────────────────────────────────────────┘   │
│                            │                                    │
│                            ▼                                    │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Tier 3: Quality Assurance Layer (Copilot Focus)       │   │
│  │  ───────────────────────────────────────────────       │   │
│  │  • Code Review & Best Practices                        │   │
│  │  • Security Audits                                     │   │
│  │  • Performance Optimization                            │   │
│  │  • Test Coverage Analysis                              │   │
│  │  • Documentation & Standards                           │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
```

### Collaboration Flow

```
Feature Request
      │
      ▼
┌─────────────────┐
│ Planning Phase  │
│ (All Tiers)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐         ┌──────────────────┐
│ Tier 1: Setup   │────────▶│ Infrastructure   │
│ Infrastructure  │         │ Complete         │
└────────┬────────┘         └──────────────────┘
         │                           │
         ▼                           │
┌─────────────────┐         ┌──────┴───────────┐
│ Tier 2: Build   │────────▶│ Feature          │
│ Features        │         │ Implemented      │
└────────┬────────┘         └──────────────────┘
         │                           │
         ▼                           │
┌─────────────────┐         ┌──────┴───────────┐
│ Tier 3: Review  │────────▶│ Quality          │
│ & Quality       │         │ Approved         │
└────────┬────────┘         └──────────────────┘
         │                           │
         ▼                           │
┌─────────────────┐         ┌──────┴───────────┐
│ Integration     │────────▶│ Ready for        │
│ & Deployment    │         │ Production       │
└─────────────────┘         └──────────────────┘
```

---

## 🔧 Technical Architecture

### Backend Architecture (Node.js/TypeScript)

```
┌──────────────────────────────────────────────────────────┐
│                      Backend API                          │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │         HTTP Layer (Fastify)                     │   │
│  │  • CORS, Helmet, Rate Limiting                   │   │
│  │  • JWT Authentication Middleware                 │   │
│  │  • Request Validation (Zod)                      │   │
│  └───────────────────┬──────────────────────────────┘   │
│                      │                                    │
│  ┌───────────────────▼──────────────────────────────┐   │
│  │         Route Handlers                           │   │
│  │  • /api/auth     • /api/projects                 │   │
│  │  • /api/rfis     • /api/tasks                    │   │
│  │  • /api/files    • /api/calendar                 │   │
│  └───────────────────┬──────────────────────────────┘   │
│                      │                                    │
│  ┌───────────────────▼──────────────────────────────┐   │
│  │         Business Logic Layer                     │   │
│  │  • ProjectService    • RFIService                │   │
│  │  • TaskService       • FileService               │   │
│  │  • AuthService       • UserService               │   │
│  └───────────────────┬──────────────────────────────┘   │
│                      │                                    │
│  ┌───────────────────▼──────────────────────────────┐   │
│  │         Data Access Layer                        │   │
│  │  • Prisma ORM                                    │   │
│  │  • Query Optimization                            │   │
│  │  • Transaction Management                        │   │
│  └───────────────────┬──────────────────────────────┘   │
│                      │                                    │
│  ┌───────────────────▼──────────────────────────────┐   │
│  │         Infrastructure Layer                     │   │
│  │  • Redis Client       • Queue Manager            │   │
│  │  • Logger (Winston)   • Environment Config       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

### Frontend Architecture (React/TypeScript)

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend Application                   │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Routing Layer (React Router)             │   │
│  │  • Protected Routes                              │   │
│  │  • Route Guards                                  │   │
│  └───────────────────┬──────────────────────────────┘   │
│                      │                                    │
│  ┌───────────────────▼──────────────────────────────┐   │
│  │         Page Components                          │   │
│  │  • DashboardPage    • ProjectsPage               │   │
│  │  • RFIsPage         • TasksPage                  │   │
│  │  • LoginPage        • CalendarPage               │   │
│  └───────────────────┬──────────────────────────────┘   │
│                      │                                    │
│  ┌───────────────────▼──────────────────────────────┐   │
│  │         React Contexts (State Management)        │   │
│  │  • AuthContext      • ProjectContext             │   │
│  │  • ToastContext                                  │   │
│  └───────────────────┬──────────────────────────────┘   │
│                      │                                    │
│  ┌───────────────────▼──────────────────────────────┐   │
│  │         Reusable Components                      │   │
│  │  • Layout           • Sidebar                    │   │
│  │  • Card             • Button                     │   │
│  │  • Form Elements    • Modals                     │   │
│  └───────────────────┬──────────────────────────────┘   │
│                      │                                    │
│  ┌───────────────────▼──────────────────────────────┐   │
│  │         Utilities & Hooks                        │   │
│  │  • API Client       • Custom Hooks               │   │
│  │  • Formatters       • Validators                 │   │
│  └──────────────────────────────────────────────────┘   │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

### BIM Service Architecture (Python/FastAPI)

```
┌──────────────────────────────────────────────────────────┐
│                    BIM Processing Service                 │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │         API Layer (FastAPI)                      │   │
│  │  • File Upload Endpoints                         │   │
│  │  • IFC Processing Endpoints                      │   │
│  │  • Cost Estimation Endpoints                     │   │
│  └───────────────────┬──────────────────────────────┘   │
│                      │                                    │
│  ┌───────────────────▼──────────────────────────────┐   │
│  │         BIM Processing Engine                    │   │
│  │  • IFC Parser (ifcopenshell)                     │   │
│  │  • Quantity Takeoff                              │   │
│  │  • Material Analysis                             │   │
│  └───────────────────┬──────────────────────────────┘   │
│                      │                                    │
│  ┌───────────────────▼──────────────────────────────┐   │
│  │         Cost Estimation                          │   │
│  │  • Material Cost Database                        │   │
│  │  • Labor Cost Calculation                        │   │
│  │  • Total Project Estimation                      │   │
│  └───────────────────┬──────────────────────────────┘   │
│                      │                                    │
│  ┌───────────────────▼──────────────────────────────┐   │
│  │         Caching & AI Integration                 │   │
│  │  • Redis Caching                                 │   │
│  │  • Ollama LLM Integration (optional)             │   │
│  └──────────────────────────────────────────────────┘   │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### Authentication Flow

```
┌─────────┐                ┌─────────┐                ┌──────────┐
│ Client  │                │ Backend │                │ Database │
└────┬────┘                └────┬────┘                └────┬─────┘
     │                          │                          │
     │  POST /api/auth/login    │                          │
     │─────────────────────────▶│                          │
     │  { email, password }     │                          │
     │                          │  Query user by email      │
     │                          │─────────────────────────▶│
     │                          │                          │
     │                          │◀─────────────────────────│
     │                          │  User data               │
     │                          │                          │
     │                          │  Verify password (bcrypt)│
     │                          │                          │
     │                          │  Generate JWT token      │
     │                          │                          │
     │◀─────────────────────────│                          │
     │  { token, user }         │                          │
     │                          │                          │
     │  Subsequent requests     │                          │
     │  with Authorization      │                          │
     │─────────────────────────▶│                          │
     │  Bearer <token>          │                          │
     │                          │  Verify JWT              │
     │                          │                          │
     │◀─────────────────────────│                          │
     │  Protected data          │                          │
```

### Project Creation Flow

```
┌─────────┐     ┌──────────┐     ┌─────────┐     ┌───────┐     ┌──────┐
│ Client  │     │ Backend  │     │ Prisma  │     │  DB   │     │Queue │
└────┬────┘     └────┬─────┘     └────┬────┘     └───┬───┘     └──┬───┘
     │               │                 │              │            │
     │ POST /api/    │                 │              │            │
     │ projects      │                 │              │            │
     │──────────────▶│                 │              │            │
     │               │                 │              │            │
     │               │ Validate input  │              │            │
     │               │ (Zod schema)    │              │            │
     │               │                 │              │            │
     │               │ Create project  │              │            │
     │               │────────────────▶│              │            │
     │               │                 │              │            │
     │               │                 │ INSERT INTO  │            │
     │               │                 │ projects     │            │
     │               │                 │─────────────▶│            │
     │               │                 │              │            │
     │               │                 │◀─────────────│            │
     │               │                 │ Project data │            │
     │               │◀────────────────│              │            │
     │               │                 │              │            │
     │               │ Queue notification job         │            │
     │               │────────────────────────────────────────────▶│
     │               │                 │              │            │
     │◀──────────────│                 │              │            │
     │ { success,    │                 │              │            │
     │   data }      │                 │              │            │
```

### File Upload Flow

```
┌────────┐    ┌─────────┐    ┌──────────┐    ┌───────┐    ┌──────┐
│ Client │    │ Backend │    │ Storage  │    │  DB   │    │Queue │
└───┬────┘    └────┬────┘    └────┬─────┘    └───┬───┘    └──┬───┘
    │              │              │              │           │
    │ POST /api/   │              │              │           │
    │ files/upload │              │              │           │
    │─────────────▶│              │              │           │
    │ multipart/   │              │              │           │
    │ form-data    │              │              │           │
    │              │              │              │           │
    │              │ Validate     │              │           │
    │              │ file         │              │           │
    │              │              │              │           │
    │              │ Save to      │              │           │
    │              │ storage      │              │           │
    │              │─────────────▶│              │           │
    │              │              │              │           │
    │              │◀─────────────│              │           │
    │              │ File path    │              │           │
    │              │              │              │           │
    │              │ Create file  │              │           │
    │              │ record       │              │           │
    │              │──────────────────────────▶ │           │
    │              │              │              │           │
    │              │◀──────────────────────────── │          │
    │              │              │              │           │
    │              │ Queue file   │              │           │
    │              │ processing   │              │           │
    │              │──────────────────────────────────────▶ │
    │              │              │              │           │
    │◀─────────────│              │              │           │
    │ { fileId,    │              │              │           │
    │   url }      │              │              │           │
```

---

## 🔒 Security Architecture

### Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      Security Layers                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Layer 1: Network Security                            │ │
│  │  • HTTPS/TLS encryption                               │ │
│  │  • CORS configuration                                 │ │
│  │  • Rate limiting                                      │ │
│  │  • DDoS protection                                    │ │
│  └───────────────────────────────────────────────────────┘ │
│                           │                                  │
│  ┌────────────────────────▼──────────────────────────────┐ │
│  │  Layer 2: Application Security                        │ │
│  │  • JWT authentication                                 │ │
│  │  • Role-based access control (RBAC)                   │ │
│  │  • Input validation (Zod)                             │ │
│  │  • SQL injection prevention (Prisma)                  │ │
│  │  • XSS prevention                                     │ │
│  │  • CSRF protection                                    │ │
│  └───────────────────────────────────────────────────────┘ │
│                           │                                  │
│  ┌────────────────────────▼──────────────────────────────┐ │
│  │  Layer 3: Data Security                               │ │
│  │  • Password hashing (bcrypt)                          │ │
│  │  • Encrypted sensitive data                           │ │
│  │  • Secure session management                          │ │
│  │  • Database encryption at rest                        │ │
│  └───────────────────────────────────────────────────────┘ │
│                           │                                  │
│  ┌────────────────────────▼──────────────────────────────┐ │
│  │  Layer 4: Infrastructure Security                     │ │
│  │  • Container isolation                                │ │
│  │  • Environment variable protection                    │ │
│  │  • Secrets management                                 │ │
│  │  • Audit logging                                      │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Authentication & Authorization

```
Request
   │
   ▼
┌─────────────────┐
│ Rate Limiter    │  ─────▶  Reject if too many requests
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ JWT Verification│  ─────▶  Reject if invalid token
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ User Lookup     │  ─────▶  Reject if user not found
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Authorization   │  ─────▶  Reject if insufficient permissions
│ Check           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Route Handler   │
└─────────────────┘
```

---

## 🚀 Deployment Architecture

### Production Deployment

```
┌─────────────────────────────────────────────────────────────────┐
│                         Cloud Infrastructure                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Load Balancer                          │  │
│  │                    (HTTPS/SSL)                            │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                          │
│       ┌───────────────┼───────────────┐                         │
│       │               │               │                         │
│  ┌────▼────┐    ┌────▼────┐    ┌────▼────┐                    │
│  │Frontend │    │Frontend │    │Frontend │                    │
│  │Instance │    │Instance │    │Instance │                    │
│  │  (CDN)  │    │  (CDN)  │    │  (CDN)  │                    │
│  └─────────┘    └─────────┘    └─────────┘                    │
│                                                                   │
│       ┌───────────────┼───────────────┐                         │
│       │               │               │                         │
│  ┌────▼────┐    ┌────▼────┐    ┌────▼────┐                    │
│  │Backend  │    │Backend  │    │Backend  │                    │
│  │Instance │    │Instance │    │Instance │                    │
│  │  (API)  │    │  (API)  │    │  (API)  │                    │
│  └────┬────┘    └────┬────┘    └────┬────┘                    │
│       │               │               │                         │
│       └───────────────┼───────────────┘                         │
│                       │                                          │
│  ┌────────────────────▼──────────────────────────────────┐     │
│  │                  Data Layer                            │     │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │     │
│  │  │ PostgreSQL  │  │   Redis     │  │  S3/Blob    │   │     │
│  │  │  (Primary)  │  │  (Cache)    │  │  Storage    │   │     │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │     │
│  │  ┌─────────────┐                                      │     │
│  │  │ PostgreSQL  │                                      │     │
│  │  │  (Replica)  │                                      │     │
│  │  └─────────────┘                                      │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Monitoring & Logging                     │  │
│  │  • Application Monitoring (e.g., Sentry)                  │  │
│  │  • Infrastructure Monitoring (e.g., CloudWatch)           │  │
│  │  • Log Aggregation (e.g., ELK Stack)                      │  │
│  │  • Performance Metrics                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Docker Deployment

```
docker-compose.yml
    │
    ├─── postgres:15-alpine
    │    └── Port: 5432
    │
    ├─── redis:7-alpine
    │    └── Port: 6379
    │
    ├─── backend
    │    ├── Build: ./backend/Dockerfile
    │    ├── Port: 8080
    │    └── Depends: postgres, redis
    │
    ├─── bim
    │    ├── Build: ./bim/Dockerfile
    │    ├── Port: 8000
    │    └── Depends: redis
    │
    └─── frontend
         ├── Build: ./frontend/Dockerfile
         ├── Port: 5173
         └── Depends: backend
```

---

## 📊 Performance Considerations

### Caching Strategy

```
┌─────────────────────────────────────────────────────────┐
│                    Caching Layers                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Level 1: Browser Cache                                 │
│  • Static assets (images, CSS, JS)                      │
│  • TTL: 1 year for versioned assets                     │
│                                                           │
│  Level 2: CDN Cache                                      │
│  • Frontend static files                                │
│  • API responses (where appropriate)                    │
│  • TTL: Configurable per resource                       │
│                                                           │
│  Level 3: Redis Cache                                    │
│  • Session data                                          │
│  • Frequently accessed data                             │
│  • BIM processing results                               │
│  • TTL: 5-60 minutes depending on data                  │
│                                                           │
│  Level 4: Database Query Cache                           │
│  • PostgreSQL query cache                               │
│  • Materialized views for complex queries               │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### Database Optimization

- **Indexes**: Created on frequently queried fields
- **Query Optimization**: Use EXPLAIN ANALYZE for slow queries
- **Connection Pooling**: Configured in Prisma
- **Read Replicas**: For scaling read operations
- **Partitioning**: For large tables (future consideration)

---

## 🔄 Continuous Integration/Deployment

```
GitHub Push
    │
    ▼
┌──────────────┐
│ CI Pipeline  │
│ (GitHub      │
│  Actions)    │
└──────┬───────┘
       │
       ├─── Lint & Type Check
       │
       ├─── Run Tests
       │    ├── Unit Tests
       │    ├── Integration Tests
       │    └── E2E Tests
       │
       ├─── Build
       │    ├── Backend (TypeScript → JavaScript)
       │    ├── Frontend (Vite build)
       │    └── Docker Images
       │
       ├─── Security Scan
       │    ├── npm audit
       │    ├── SAST (Static Analysis)
       │    └── Container scan
       │
       └─── Deploy
            ├── Staging Environment (auto)
            └── Production (manual approval)
```

---

## 📚 Related Documentation

- [TEAM_WORKFLOW.md](./TEAM_WORKFLOW.md) - 3-tier collaboration process
- [BUILD_GUIDANCE.md](./BUILD_GUIDANCE.md) - Detailed specifications
- [REVIEW_CHECKLIST.md](./REVIEW_CHECKLIST.md) - Code review standards
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [README.md](./README.md) - Project overview

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-13  
**Maintained By**: InstallSure Development Team
