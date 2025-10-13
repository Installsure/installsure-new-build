# 🤝 Contributing to InstallSure

Thank you for your interest in contributing to InstallSure! This guide will help you understand our 3-tier collaborative development process.

## 📋 Table of Contents
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Docker and Docker Compose
- Git
- PostgreSQL (optional, can use Docker)
- Redis (optional, can use Docker)

### Initial Setup
```bash
# Clone the repository
git clone https://github.com/Installsure/installsure-new-build.git
cd installsure-new-build

# Install backend dependencies
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration

# Install frontend dependencies
cd ../frontend
npm install
cp .env.example .env

# Install BIM service dependencies
cd ../bim
pip install -r requirements.txt
cp .env.example .env

# Start services with Docker
cd ..
docker-compose up -d

# Run migrations and seed data
cd backend
npm run prisma:migrate
npm run seed

# Start development servers
npm run dev
```

## 🔄 Development Workflow

InstallSure uses a **3-tier team approach** where different tools/team members focus on specific aspects:

### Tier 1: Infrastructure (VS Code Focus)
- Project structure and configuration
- Build scripts and tooling
- Docker and deployment
- Database schema and migrations
- Environment configuration

### Tier 2: Implementation (Cursor Focus)
- Feature development
- API endpoints
- Business logic
- Frontend components
- Integration tests

### Tier 3: Quality Assurance (GitHub Copilot Focus)
- Code review
- Test coverage
- Documentation
- Security audits
- Performance optimization

**All contributors should:**
1. Read [TEAM_WORKFLOW.md](./TEAM_WORKFLOW.md) for collaboration process
2. Follow [BUILD_GUIDANCE.md](./BUILD_GUIDANCE.md) for specifications
3. Use [REVIEW_CHECKLIST.md](./REVIEW_CHECKLIST.md) before submitting

## 🎨 Coding Standards

### TypeScript/JavaScript
```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  name: string;
}

async function getUser(id: string): Promise<User> {
  try {
    return await prisma.user.findUnique({ where: { id } });
  } catch (error) {
    logger.error('Failed to fetch user', { id, error });
    throw new NotFoundError('User');
  }
}

// ❌ Bad
async function getUser(id: any) {
  return await prisma.user.findUnique({ where: { id } });
}
```

### React Components
```typescript
// ✅ Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  label, 
  onClick, 
  variant = 'primary',
  disabled = false 
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
      aria-label={label}
    >
      {label}
    </button>
  );
};

// ❌ Bad
export const Button = (props: any) => {
  return <button onClick={props.onClick}>{props.label}</button>;
};
```

### API Endpoints
```typescript
// ✅ Good
fastify.get('/api/projects/:id', {
  preHandler: [authenticate],
  schema: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
}, async (request, reply) => {
  const { id } = request.params;
  
  try {
    const project = await projectService.findById(id);
    
    if (!project) {
      throw new NotFoundError('Project');
    }
    
    // Authorization check
    if (!canAccessProject(request.user, project)) {
      throw new AuthorizationError();
    }
    
    return { success: true, data: project };
  } catch (error) {
    // Error handling
    throw error;
  }
});

// ❌ Bad
fastify.get('/api/projects/:id', async (request, reply) => {
  const project = await prisma.project.findUnique({
    where: { id: request.params.id }
  });
  return project;
});
```

### Naming Conventions
- **Files**: kebab-case (`user-service.ts`, `project-card.tsx`)
- **Classes/Interfaces**: PascalCase (`UserService`, `ProjectCard`)
- **Functions/Variables**: camelCase (`getUserById`, `projectList`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`, `API_BASE_URL`)
- **Private Members**: prefix with _ (`_cache`, `_validateInput`)

## 📝 Commit Guidelines

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process or tooling changes
- `ci`: CI/CD changes

### Examples
```bash
# Good commits
feat(api): add project filtering by status
fix(auth): resolve JWT token expiration bug
docs(readme): update installation instructions
test(projects): add integration tests for CRUD operations

# Bad commits
fixed stuff
WIP
update
changes
```

### Commit Body Guidelines
- Explain **what** and **why**, not **how**
- Reference issues with `Fixes #123` or `Relates to #456`
- Keep lines under 72 characters
- Use bullet points for multiple changes

```bash
# Good commit with body
feat(api): add bulk project import functionality

- Supports CSV and JSON formats
- Validates data before import
- Provides detailed error reporting
- Includes progress tracking

Fixes #234
Relates to #456
```

## 🔀 Pull Request Process

### Before Creating a PR

1. **Update your branch**
```bash
git checkout main
git pull origin main
git checkout your-feature-branch
git rebase main
```

2. **Run all checks**
```bash
npm run lint        # Lint code
npm run build       # Ensure build works
npm run test        # Run all tests
npm run test:coverage # Check coverage
```

3. **Update documentation**
- Update README.md if needed
- Add/update API documentation
- Update CHANGELOG.md
- Add code comments for complex logic

### Creating a PR

**PR Title Format:**
```
<type>(<scope>): <description>
```

**PR Description Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #123
Relates to #456

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed
- [ ] Test coverage >80%

## Documentation
- [ ] Code comments added
- [ ] API documentation updated
- [ ] README updated if needed
- [ ] CHANGELOG updated

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests pass locally
- [ ] No console errors/warnings
- [ ] Documentation updated

## Screenshots (if applicable)
[Add screenshots here]

## Tier Reviews
- [ ] Tier 1 (Infrastructure): Approved
- [ ] Tier 2 (Implementation): Approved
- [ ] Tier 3 (Quality): Approved
```

### Review Process

Your PR will go through three levels of review:

1. **Tier 1 Review (Infrastructure)**
   - Checks project structure
   - Validates configuration
   - Reviews build setup

2. **Tier 2 Review (Implementation)**
   - Reviews code logic
   - Tests functionality
   - Validates requirements

3. **Tier 3 Review (Quality)**
   - Performs security audit
   - Checks test coverage
   - Reviews documentation
   - Validates performance

**All three tiers must approve before merge.**

### Addressing Review Feedback

```bash
# Make changes based on feedback
git add .
git commit -m "fix: address review feedback"
git push origin your-feature-branch

# Force push after rebase (if needed)
git rebase main
git push origin your-feature-branch --force-with-lease
```

## 🧪 Testing Requirements

### Test Coverage Targets
- **Overall**: >80%
- **Critical Paths**: >95%
- **New Code**: 100%

### Test Structure
```typescript
describe('Feature/Component Name', () => {
  describe('method/function name', () => {
    it('should do something in normal case', () => {
      // Arrange
      const input = createTestInput();
      
      // Act
      const result = methodUnderTest(input);
      
      // Assert
      expect(result).toBe(expectedValue);
    });

    it('should handle edge case', () => {
      // Test edge case
    });

    it('should throw error for invalid input', () => {
      expect(() => methodUnderTest(invalidInput))
        .toThrow(ValidationError);
    });
  });
});
```

### Running Tests
```bash
# All tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm run test:coverage

# Specific file
npm test -- user-service.test.ts

# Integration tests only
npm run test:integration
```

## 📚 Documentation

### Code Documentation
```typescript
/**
 * Retrieves a project by ID with authorization check
 * 
 * @param projectId - UUID of the project
 * @param userId - UUID of the requesting user
 * @returns Project object with related data
 * @throws {NotFoundError} When project doesn't exist
 * @throws {AuthorizationError} When user lacks access
 * 
 * @example
 * const project = await getProject('uuid-here', 'user-uuid');
 */
async function getProject(
  projectId: string, 
  userId: string
): Promise<ProjectWithDetails> {
  // Implementation
}
```

### API Documentation
Use JSDoc comments that can be exported to OpenAPI/Swagger:

```typescript
/**
 * @openapi
 * /api/projects:
 *   get:
 *     summary: List all projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 */
```

## 🐛 Reporting Bugs

### Bug Report Template
```markdown
**Description**
Clear description of the bug

**To Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Screenshots**
If applicable

**Environment**
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 96]
- Version: [e.g., 2.0.0]

**Additional Context**
Any other relevant information
```

## 💡 Feature Requests

### Feature Request Template
```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Describe the solution you'd like**
Clear description of desired functionality

**Describe alternatives you've considered**
Any alternative solutions or features

**Additional context**
Any other context, screenshots, or mockups

**Implementation Considerations**
- Affected components
- Database changes needed
- API changes needed
- Breaking changes
```

## 🎯 Development Tips

### Hot Reload
```bash
# Backend (uses tsx watch)
cd backend
npm run dev

# Frontend (uses Vite)
cd frontend
npm run dev

# BIM Service (uses uvicorn reload)
cd bim
uvicorn main:app --reload
```

### Debugging
```bash
# Node.js debugging
node --inspect-brk dist/index.js

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Database inspection
npx prisma studio
```

### Common Issues

**Port already in use:**
```bash
# Find process using port
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

**Prisma issues:**
```bash
# Reset database
npm run prisma:migrate reset

# Regenerate client
npm run prisma:generate
```

**Docker issues:**
```bash
# Clean rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

## 📞 Getting Help

- **Documentation**: Start with [README.md](./README.md)
- **Workflow**: See [TEAM_WORKFLOW.md](./TEAM_WORKFLOW.md)
- **Specifications**: Check [BUILD_GUIDANCE.md](./BUILD_GUIDANCE.md)
- **Issues**: Create a GitHub issue
- **Discussions**: Use GitHub Discussions

## 📜 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing to InstallSure! 🎉**

**Version**: 1.0.0  
**Last Updated**: 2025-10-13
