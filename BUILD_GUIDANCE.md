# 🏗️ InstallSure Build Guidance - Detailed Specifications

## 📋 Table of Contents
- [Tier 1: VS Code - Infrastructure Specifications](#tier-1-vs-code---infrastructure-specifications)
- [Tier 2: Cursor - Feature Implementation Specifications](#tier-2-cursor---feature-implementation-specifications)
- [Tier 3: GitHub Copilot - Quality Assurance Specifications](#tier-3-github-copilot---quality-assurance-specifications)

---

# Tier 1: VS Code - Infrastructure Specifications

## 🎯 Mission
Establish and maintain robust infrastructure, configuration, and development environment for the InstallSure platform.

## 📁 Project Structure Requirements

### Backend Structure
```
backend/
├── src/
│   ├── index.ts              # Main server entry point
│   ├── server.ts             # Server factory and configuration
│   ├── lib/                  # Core infrastructure libraries
│   │   ├── env.ts            # Environment configuration (Zod validation)
│   │   ├── redis.ts          # Redis client management
│   │   ├── queue.ts          # BullMQ job queue system
│   │   ├── http.ts           # Fastify server factory
│   │   └── logger.ts         # Winston structured logging
│   ├── config/               # Legacy config (to be migrated)
│   │   └── env.ts
│   ├── infra/                # Infrastructure utilities
│   │   ├── config.ts         # Alternative config pattern
│   │   └── monitoring.ts     # Health checks and metrics
│   ├── processors/           # Background job processors
│   │   ├── fileProcessors.ts
│   │   ├── emailProcessors.ts
│   │   └── notificationProcessors.ts
│   ├── routes/               # API route handlers (Cursor responsibility)
│   ├── services/             # Business logic services (Cursor responsibility)
│   └── types/                # TypeScript type definitions
├── prisma/
│   ├── schema.prisma         # Database schema definition
│   ├── migrations/           # Database migrations
│   └── seed.ts               # Demo data seeding
├── tests/                    # Test files
│   ├── smoke.test.ts
│   ├── api.health.test.ts
│   └── setup.ts
├── Dockerfile                # Backend containerization
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── .env.example              # Environment variable template
└── .gitignore                # Git ignore patterns
```

### Frontend Structure
```
frontend/
├── src/
│   ├── App.tsx               # Main application component
│   ├── main.tsx              # Application entry point
│   ├── pages/                # Page components (Cursor responsibility)
│   ├── components/           # Reusable components (Cursor responsibility)
│   ├── contexts/             # React contexts (Cursor responsibility)
│   ├── hooks/                # Custom hooks (Cursor responsibility)
│   ├── utils/                # Utility functions
│   │   └── api.ts            # API client
│   └── types/                # TypeScript interfaces
├── public/                   # Static assets
├── Dockerfile                # Frontend containerization
├── package.json              # Dependencies and scripts
├── vite.config.ts            # Vite build configuration
├── tailwind.config.cjs       # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── .env.example              # Environment variable template
```

### BIM Service Structure
```
bim/
├── main.py                   # FastAPI BIM service
├── requirements.txt          # Python dependencies
├── Dockerfile                # BIM service containerization
└── .env.example              # Environment variable template
```

### Root Level Configuration
```
project-root/
├── docker-compose.yml        # Multi-service orchestration
├── .gitignore                # Global ignore patterns
├── README.md                 # Project documentation
├── TEAM_WORKFLOW.md          # Team collaboration guide
├── BUILD_GUIDANCE.md         # This file
├── REVIEW_CHECKLIST.md       # Code review standards
├── MIGRATION_GUIDE.md        # Migration instructions
└── scripts/                  # Development scripts
    ├── dev.ps1               # Windows dev startup
    ├── dev.sh                # Unix dev startup
    ├── build.ps1             # Production build
    ├── test.ps1              # Test runner
    └── db-reset.ps1          # Database reset
```

## 🔧 Configuration Files Specifications

### package.json (Backend)
**Required Scripts**:
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest",
    "test:integration": "jest --testPathPattern=integration",
    "test:api": "jest --testPathPattern=api",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:deploy": "prisma migrate deploy",
    "seed": "tsx prisma/seed.ts"
  }
}
```

**Required Dependencies**:
- Fastify ecosystem (@fastify/cors, @fastify/helmet, @fastify/jwt, @fastify/multipart, @fastify/rate-limit)
- Prisma ORM (@prisma/client, prisma)
- BullMQ for job queues
- IORedis for Redis client
- Zod for validation
- Winston/Pino for logging
- TypeScript and related types

### tsconfig.json (Backend)
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### docker-compose.yml
**Required Services**:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: installsure
      POSTGRES_PASSWORD: installsure_dev
      POSTGRES_DB: installsure
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: postgresql://installsure:installsure_dev@postgres:5432/installsure
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

  bim:
    build: ./bim
    ports:
      - "8000:8000"
    environment:
      REDIS_URL: redis://redis:6379
    depends_on:
      - redis

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:8080
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

## 🔐 Environment Configuration

### Required Environment Variables

**Backend (.env)**:
```bash
# Core Configuration
NODE_ENV=development
PORT=8080
HOST=0.0.0.0
API_SECRET=your-secure-api-secret-min-32-chars
JWT_SECRET=your-jwt-secret-min-32-chars

# Database
DATABASE_URL=postgresql://installsure:installsure_dev@localhost:5432/installsure

# Redis
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Features
ENABLE_REAL_TIME_SYNC=true
ENABLE_FILE_PROCESSING=true
ENABLE_EMAIL_NOTIFICATIONS=true
FEATURE_ADVANCED_UPLOAD=true
FEATURE_NOTIFICATIONS=true

# Logging
LOG_LEVEL=info

# File Storage
FILES_LOCAL_DIR=./uploads
S3_ENDPOINT=
S3_BUCKET=

# External Services (Optional)
FORGE_CLIENT_ID=
FORGE_CLIENT_SECRET=
FORGE_BASE_URL=https://developer.api.autodesk.com
FORGE_BUCKET=

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

SENTRY_DSN=
GOOGLE_ANALYTICS_ID=
```

**Frontend (.env)**:
```bash
VITE_API_URL=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
VITE_BIM_URL=http://localhost:8000
```

**BIM Service (.env)**:
```bash
REDIS_URL=redis://localhost:6379
OLLAMA_HOST=http://localhost:11434
PORT=8000
```

## 🐳 Docker Configuration Standards

### Dockerfile Best Practices
- Use multi-stage builds for smaller images
- Pin specific versions for reproducibility
- Use .dockerignore to exclude unnecessary files
- Set proper health checks
- Use non-root user for security
- Optimize layer caching

**Example Backend Dockerfile**:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY . .
RUN npm run prisma:generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 fastify
COPY --from=builder --chown=fastify:nodejs /app/dist ./dist
COPY --from=builder --chown=fastify:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=fastify:nodejs /app/package.json ./package.json
USER fastify
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"
CMD ["node", "dist/index.js"]
```

## 📊 Database Schema Requirements (Prisma)

### Core Models to Define
```prisma
// User Management
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      Role     @default(MEMBER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  OWNER
  ADMIN
  PROJECT_MANAGER
  MEMBER
}

// Project Management
model Project {
  id          String   @id @default(uuid())
  name        String
  description String?
  status      String   @default("active")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Additional models: RFI, Task, ChangeOrder, Tag, File, CalendarEvent, etc.
```

## 🔨 Build Scripts Requirements

### Development Script (dev.ps1)
**Responsibilities**:
1. Check for required tools (Node, Python, Docker)
2. Start PostgreSQL and Redis containers
3. Run database migrations
4. Seed demo data
5. Start backend, BIM service, and frontend
6. Display startup information

### Build Script (build.ps1)
**Responsibilities**:
1. Validate environment
2. Install production dependencies
3. Run Prisma generate
4. Build TypeScript
5. Build Python requirements
6. Build frontend assets
7. Create Docker images
8. Tag and prepare for deployment

### Test Script (test.ps1)
**Responsibilities**:
1. Run unit tests
2. Run integration tests
3. Generate coverage reports
4. Run linting
5. Report results

## ✅ Acceptance Criteria

### Infrastructure Setup Complete When:
- [ ] All configuration files present and valid
- [ ] Docker containers build without errors
- [ ] docker-compose up starts all services
- [ ] Environment variables properly templated
- [ ] Build scripts execute successfully
- [ ] Database migrations apply cleanly
- [ ] All dependencies installed without conflicts
- [ ] TypeScript compiles without errors
- [ ] Linting passes with zero errors
- [ ] Basic health checks pass

---

# Tier 2: Cursor - Feature Implementation Specifications

## 🎯 Mission
Implement robust, scalable features that fulfill business requirements while maintaining code quality and testability.

## 🚀 Backend API Implementation

### API Endpoint Standards

**Standard Response Format**:
```typescript
// Success Response
{
  success: true,
  data: T,
  meta?: {
    page?: number,
    perPage?: number,
    total?: number
  }
}

// Error Response
{
  success: false,
  error: string,
  message: string,
  details?: any
}
```

**Required Endpoints by Module**:

#### Authentication Module
```typescript
POST   /api/auth/register     // User registration
POST   /api/auth/login        // User login
POST   /api/auth/logout       // User logout
GET    /api/auth/me           // Get current user
POST   /api/auth/refresh      // Refresh JWT token
POST   /api/auth/forgot       // Password reset request
POST   /api/auth/reset        // Password reset confirmation
```

#### Projects Module
```typescript
GET    /api/projects          // List all projects (with pagination)
POST   /api/projects          // Create new project
GET    /api/projects/:id      // Get project details
PUT    /api/projects/:id      // Update project
DELETE /api/projects/:id      // Delete project
GET    /api/projects/:id/stats // Get project statistics
```

#### RFI Module
```typescript
GET    /api/rfis              // List RFIs (filterable by project)
POST   /api/rfis              // Create RFI
GET    /api/rfis/:id          // Get RFI details
PUT    /api/rfis/:id          // Update RFI
DELETE /api/rfis/:id          // Delete RFI
POST   /api/rfis/:id/respond  // Respond to RFI
```

#### Tasks Module
```typescript
GET    /api/tasks             // List tasks
POST   /api/tasks             // Create task
GET    /api/tasks/:id         // Get task details
PUT    /api/tasks/:id         // Update task
DELETE /api/tasks/:id         // Delete task
POST   /api/tasks/:id/assign  // Assign task to user
```

#### Files Module
```typescript
POST   /api/files/upload      // Upload file
GET    /api/files/:id         // Download file
DELETE /api/files/:id         // Delete file
GET    /api/files             // List files
```

#### BIM Module
```typescript
POST   /api/autocad/upload    // Upload CAD file
POST   /api/autocad/translate // Translate CAD file
GET    /api/autocad/status/:urn // Check translation status
GET    /api/autocad/manifest/:urn // Get file manifest
```

### Error Handling Requirements

**Custom Error Classes**:
```typescript
class ValidationError extends Error {
  statusCode = 400;
  constructor(message: string, public details?: any) {
    super(message);
  }
}

class AuthenticationError extends Error {
  statusCode = 401;
  constructor(message: string = 'Authentication required') {
    super(message);
  }
}

class AuthorizationError extends Error {
  statusCode = 403;
  constructor(message: string = 'Insufficient permissions') {
    super(message);
  }
}

class NotFoundError extends Error {
  statusCode = 404;
  constructor(resource: string) {
    super(`${resource} not found`);
  }
}
```

**Global Error Handler**:
```typescript
fastify.setErrorHandler((error, request, reply) => {
  // Log error
  logger.error('Request failed', {
    url: request.url,
    method: request.method,
    error: error.message,
    stack: error.stack,
  });

  // Determine status code
  const statusCode = error.statusCode || 500;

  // Send response
  reply.status(statusCode).send({
    success: false,
    error: error.name,
    message: error.message,
    details: error.details || undefined,
  });
});
```

### Middleware Requirements

**Authentication Middleware**:
```typescript
async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (error) {
    throw new AuthenticationError();
  }
}
```

**Authorization Middleware**:
```typescript
function authorize(...roles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;
    if (!roles.includes(user.role)) {
      throw new AuthorizationError();
    }
  };
}
```

**Validation Middleware**:
```typescript
function validate<T>(schema: z.ZodSchema<T>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.body = await schema.parseAsync(request.body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Validation failed', error.errors);
      }
      throw error;
    }
  };
}
```

## 🎨 Frontend Implementation

### Component Structure Standards

**React Component Template**:
```typescript
import React from 'react';

interface ComponentNameProps {
  // Props definition
}

export const ComponentName: React.FC<ComponentNameProps> = (props) => {
  // Hooks
  const [state, setState] = React.useState();
  
  // Effects
  React.useEffect(() => {
    // Effect logic
  }, []);

  // Handlers
  const handleEvent = () => {
    // Handler logic
  };

  // Render
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};
```

### Required React Contexts

**AuthContext**:
```typescript
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

**ProjectContext**:
```typescript
interface ProjectContextType {
  projects: Project[];
  selectedProject: Project | null;
  selectProject: (id: string) => void;
  createProject: (data: CreateProjectData) => Promise<Project>;
  updateProject: (id: string, data: UpdateProjectData) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  isLoading: boolean;
}
```

**ToastContext**:
```typescript
interface ToastContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
}
```

### Page Components Required

1. **LoginPage**: User authentication
2. **RegisterPage**: User registration
3. **DashboardPage**: Overview of projects and statistics
4. **ProjectsPage**: List and manage projects
5. **ProjectDetailPage**: Single project view
6. **RFIsPage**: RFI management
7. **TasksPage**: Task tracking
8. **CalendarPage**: Calendar and scheduling
9. **FilesPage**: File management
10. **SettingsPage**: User and app settings

### State Management Patterns

**Use React Query for Server State**:
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['projects'],
  queryFn: fetchProjects,
});
```

**Use Context for Global State**:
```typescript
const { user, login, logout } = useAuth();
```

**Use Local State for UI State**:
```typescript
const [isOpen, setIsOpen] = useState(false);
```

## 🧪 Testing Requirements

### Unit Test Coverage
- **Minimum Coverage**: 80% overall
- **Critical Paths**: 95% coverage
- **Test Files**: Co-located with source files or in tests/ directory

**Example Test Structure**:
```typescript
describe('ProjectService', () => {
  describe('createProject', () => {
    it('should create a project successfully', async () => {
      // Arrange
      const projectData = { name: 'Test', description: 'Test' };
      
      // Act
      const result = await projectService.create(projectData);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe(projectData.name);
    });

    it('should throw ValidationError for invalid data', async () => {
      // Arrange
      const invalidData = { name: '' };
      
      // Act & Assert
      await expect(projectService.create(invalidData))
        .rejects
        .toThrow(ValidationError);
    });
  });
});
```

### Integration Test Requirements
- Test API endpoints end-to-end
- Use test database
- Clean up after each test
- Test authentication flows
- Test error scenarios

## ✅ Acceptance Criteria

### Feature Implementation Complete When:
- [ ] All required endpoints implemented
- [ ] Proper error handling in place
- [ ] Authentication and authorization working
- [ ] Database queries optimized
- [ ] API documentation generated
- [ ] Unit tests written (>80% coverage)
- [ ] Integration tests passing
- [ ] Frontend components functional
- [ ] State management working correctly
- [ ] No console errors or warnings
- [ ] Responsive design implemented
- [ ] Accessibility standards met (WCAG 2.1 AA)

---

# Tier 3: GitHub Copilot - Quality Assurance Specifications

## 🎯 Mission
Ensure code quality, security, performance, and maintainability through comprehensive review and testing.

## 🔍 Code Review Standards

### Code Quality Checklist

#### TypeScript/JavaScript
- [ ] No `any` types used (use `unknown` or specific types)
- [ ] Proper type definitions for all functions
- [ ] No unused variables or imports
- [ ] Consistent naming conventions (camelCase for variables, PascalCase for types)
- [ ] Async/await used instead of raw Promises where appropriate
- [ ] Error handling present in all async operations
- [ ] No console.log (use logger instead)
- [ ] Comments for complex logic only
- [ ] JSDoc comments for public APIs
- [ ] No TODO/FIXME without linked issues

#### React/Frontend
- [ ] Proper hook usage (no hooks in conditionals)
- [ ] Keys provided for list items
- [ ] Event handlers properly typed
- [ ] No inline styles (use Tailwind classes)
- [ ] Accessibility attributes present (aria-*, role)
- [ ] Semantic HTML used
- [ ] Loading and error states handled
- [ ] Optimistic updates where appropriate
- [ ] Memoization used for expensive computations

#### Backend/API
- [ ] Input validation on all endpoints
- [ ] Proper HTTP status codes
- [ ] Rate limiting applied
- [ ] CORS properly configured
- [ ] SQL injection prevention (use parameterized queries)
- [ ] XSS prevention (sanitize outputs)
- [ ] CSRF protection where needed
- [ ] Proper authentication checks
- [ ] Authorization checks before data access
- [ ] Audit logging for sensitive operations

### Security Review Checklist

#### Authentication & Authorization
- [ ] Passwords hashed with bcrypt (min 10 rounds)
- [ ] JWT tokens properly signed and validated
- [ ] Token expiration configured
- [ ] Refresh token rotation implemented
- [ ] Session management secure
- [ ] No credentials in code or logs
- [ ] Rate limiting on auth endpoints

#### Data Protection
- [ ] Sensitive data encrypted at rest
- [ ] TLS/HTTPS enforced
- [ ] SQL parameterization used
- [ ] Input validation comprehensive
- [ ] Output encoding applied
- [ ] File upload restrictions (size, type)
- [ ] Path traversal prevention

#### Dependencies
- [ ] No known vulnerabilities (run npm audit)
- [ ] Dependencies up to date
- [ ] License compatibility verified
- [ ] Minimal dependency footprint

### Performance Review Checklist

#### Backend Performance
- [ ] Database queries optimized (use EXPLAIN)
- [ ] Proper indexes on frequently queried fields
- [ ] N+1 query problems resolved
- [ ] Pagination implemented for large datasets
- [ ] Caching strategy in place (Redis)
- [ ] Background jobs for long-running tasks
- [ ] Connection pooling configured
- [ ] Memory leaks checked

#### Frontend Performance
- [ ] Code splitting implemented
- [ ] Lazy loading for routes
- [ ] Images optimized (WebP, proper sizes)
- [ ] Bundle size < 200KB (gzipped)
- [ ] Initial load time < 3s
- [ ] Time to interactive < 5s
- [ ] Lighthouse score > 90
- [ ] Unnecessary re-renders prevented

## 📊 Testing Standards

### Test Coverage Requirements

**Coverage Targets**:
- Overall: >80%
- Critical Business Logic: >95%
- API Endpoints: 100%
- Utility Functions: >90%
- UI Components: >70%

**Test Types Required**:
1. **Unit Tests**: Individual functions and components
2. **Integration Tests**: API endpoints and database interactions
3. **E2E Tests**: Critical user flows
4. **Performance Tests**: Load and stress testing
5. **Security Tests**: Penetration testing basics

### Test Quality Standards

**Good Test Characteristics**:
- **Isolated**: No dependencies on other tests
- **Repeatable**: Same result every time
- **Fast**: Runs in milliseconds
- **Readable**: Clear arrange-act-assert pattern
- **Maintainable**: Easy to update when code changes

**Example E2E Test**:
```typescript
describe('User Registration Flow', () => {
  it('should allow new user to register and login', async () => {
    // Arrange
    const userData = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      name: 'Test User',
    };

    // Act - Register
    const registerResponse = await api.post('/api/auth/register', userData);
    
    // Assert - Registration
    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.success).toBe(true);

    // Act - Login
    const loginResponse = await api.post('/api/auth/login', {
      email: userData.email,
      password: userData.password,
    });

    // Assert - Login
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.data.token).toBeDefined();

    // Cleanup
    await cleanupTestUser(userData.email);
  });
});
```

## 📚 Documentation Standards

### Code Documentation

**Required Documentation**:
1. **README.md**: Project overview, setup, usage
2. **API.md**: Complete API documentation
3. **ARCHITECTURE.md**: System architecture and design decisions
4. **CONTRIBUTING.md**: Contribution guidelines
5. **CHANGELOG.md**: Version history
6. **Inline Comments**: Complex logic explanation

**API Documentation Format** (OpenAPI/Swagger):
```yaml
paths:
  /api/projects:
    get:
      summary: List all projects
      description: Returns a paginated list of projects
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: perPage
          in: query
          schema:
            type: integer
            default: 10
      responses:
        200:
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Project'
```

### Architecture Documentation

**Required Diagrams**:
1. **System Architecture**: High-level component view
2. **Data Flow**: Request/response flows
3. **Database Schema**: Entity relationships
4. **Deployment Architecture**: Infrastructure layout

## 🐛 Bug Detection Guidelines

### Common Bug Patterns to Check

**Backend**:
- Race conditions in async code
- Memory leaks from unclosed connections
- Unhandled promise rejections
- SQL injection vulnerabilities
- Authentication bypass scenarios
- Missing error handling
- Infinite loops or recursion

**Frontend**:
- Memory leaks from event listeners
- Stale closure issues
- Race conditions in state updates
- Missing error boundaries
- Accessibility violations
- XSS vulnerabilities
- Performance bottlenecks

### Edge Cases to Test

1. **Empty States**: No data scenarios
2. **Boundary Values**: Min/max values
3. **Concurrent Operations**: Multiple users
4. **Network Failures**: Offline/timeout scenarios
5. **Invalid Input**: Malformed data
6. **Large Datasets**: Pagination and performance
7. **Error Recovery**: System resilience

## ⚡ Performance Optimization Guidelines

### Backend Optimization
- Use database indexes appropriately
- Implement caching layers (Redis)
- Optimize database queries
- Use connection pooling
- Implement rate limiting
- Use background jobs for heavy tasks
- Enable gzip compression
- Optimize Docker images

### Frontend Optimization
- Code split by route
- Lazy load components
- Optimize images (WebP, responsive)
- Use CDN for static assets
- Implement virtual scrolling for large lists
- Debounce/throttle frequent operations
- Memoize expensive computations
- Use web workers for heavy processing

## ✅ Acceptance Criteria

### Quality Assurance Complete When:
- [ ] All code reviewed and approved
- [ ] Test coverage targets met (>80%)
- [ ] No security vulnerabilities found
- [ ] Performance benchmarks met
- [ ] Documentation complete and accurate
- [ ] All edge cases tested
- [ ] Accessibility standards met
- [ ] Browser compatibility verified
- [ ] Mobile responsiveness confirmed
- [ ] Load testing passed
- [ ] Security audit passed
- [ ] Code smells resolved
- [ ] Technical debt documented
- [ ] Monitoring and logging in place
- [ ] Rollback plan documented

---

## 📈 Success Metrics

### Overall Project Health
- **Build Success Rate**: >95%
- **Test Pass Rate**: 100%
- **Code Coverage**: >80%
- **Security Score**: A (no high/critical vulnerabilities)
- **Performance Score**: >90 (Lighthouse)
- **Documentation Coverage**: 100% of public APIs
- **Bug Escape Rate**: <5%
- **Mean Time to Resolution**: <24 hours

### Team Collaboration
- **Review Turnaround**: <4 hours
- **Cross-Tier Review**: 100% of changes
- **Consensus Achievement**: All tiers approve
- **Knowledge Sharing**: Weekly sessions

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-13  
**Maintained By**: InstallSure Development Team
