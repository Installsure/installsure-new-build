# 🚀 Quick Start Guide - 3-Tier Team Collaboration

## Welcome to InstallSure Development!

This guide will help you get started with the 3-tier collaborative development approach for InstallSure.

---

## 📚 Essential Reading Order

If you're new to the project, read these documents in this order:

1. **[README.md](./README.md)** - Project overview and features (5 min)
2. **[TEAM_WORKFLOW.md](./TEAM_WORKFLOW.md)** - Understanding the 3-tier process (10 min)
3. **[CONTRIBUTING.md](./CONTRIBUTING.md)** - How to contribute (15 min)
4. **[BUILD_GUIDANCE.md](./BUILD_GUIDANCE.md)** - Detailed specifications for your tier (30 min)
5. **[REVIEW_CHECKLIST.md](./REVIEW_CHECKLIST.md)** - Review standards (20 min)
6. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture (optional, 20 min)

**Total time to get started: ~45-100 minutes**

---

## 🎯 Understanding Your Role

### Are you Tier 1 (Infrastructure)?
**Your focus**: Build configuration, Docker, database, CI/CD

**Start here**:
1. Read [TEAM_WORKFLOW.md](./TEAM_WORKFLOW.md) - Tier 1 section
2. Read [BUILD_GUIDANCE.md](./BUILD_GUIDANCE.md) - Tier 1 specifications
3. Review [.github/CODEOWNERS](./.github/CODEOWNERS) - Your owned files
4. Set up local environment (see below)

### Are you Tier 2 (Implementation)?
**Your focus**: Features, API endpoints, business logic, UI components

**Start here**:
1. Read [TEAM_WORKFLOW.md](./TEAM_WORKFLOW.md) - Tier 2 section
2. Read [BUILD_GUIDANCE.md](./BUILD_GUIDANCE.md) - Tier 2 specifications
3. Review existing code patterns
4. Set up local environment (see below)

### Are you Tier 3 (Quality Assurance)?
**Your focus**: Code review, testing, documentation, security

**Start here**:
1. Read [TEAM_WORKFLOW.md](./TEAM_WORKFLOW.md) - Tier 3 section
2. Read [REVIEW_CHECKLIST.md](./REVIEW_CHECKLIST.md) - Review standards
3. Review existing test patterns
4. Set up local environment (see below)

---

## ⚡ Quick Environment Setup

### Prerequisites
```bash
# Check you have these installed:
node --version    # Should be 18+
npm --version     # Should be 8+
python --version  # Should be 3.9+
docker --version  # Should be 20+
git --version     # Any recent version
```

### One-Command Setup (Recommended)
```bash
# Clone and setup everything
git clone https://github.com/Installsure/installsure-new-build.git
cd installsure-new-build

# Start with Docker (easiest)
docker-compose up -d

# Wait for services to start (30 seconds)
# Then access:
# - Frontend: http://localhost:5173
# - Backend API: http://localhost:8080
# - BIM Service: http://localhost:8000
```

### Manual Setup (for development)
```bash
# 1. Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your settings
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev

# 2. Frontend (new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev

# 3. BIM Service (new terminal)
cd bim
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload
```

### Verify Installation
```bash
# Backend health check
curl http://localhost:8080/health

# Frontend
open http://localhost:5173

# Login with demo credentials:
# Email: owner@example.com
# Password: demo123
```

---

## 🔄 Daily Workflow

### Morning Checklist
- [ ] Pull latest changes: `git pull origin main`
- [ ] Check for issues assigned to you
- [ ] Review any PRs waiting for your tier
- [ ] Plan your day's work

### Before Starting Work
1. Create a new branch: `git checkout -b feature/your-feature-name`
2. Review the requirements/issue
3. Check which tiers are involved
4. Read relevant documentation sections

### During Development
- **Tier 1**: Focus on infrastructure stability
- **Tier 2**: Focus on functionality and tests
- **Tier 3**: Focus on quality and documentation

### Before Submitting PR
1. Run tests: `npm test`
2. Run linter: `npm run lint`
3. Build: `npm run build`
4. Self-review using [REVIEW_CHECKLIST.md](./REVIEW_CHECKLIST.md)
5. Update documentation
6. Create PR using the template

### After PR Submission
- Respond to review feedback promptly
- Make requested changes
- Re-request review after changes
- Ensure all three tiers approve

---

## 🎯 Common Tasks by Tier

### Tier 1: Infrastructure Tasks
```bash
# Add a new dependency
cd backend
npm install <package-name>
# Update package.json and commit

# Add a new environment variable
# 1. Add to .env.example
# 2. Document in README.md
# 3. Update lib/env.ts validation

# Create a database migration
cd backend
npx prisma migrate dev --name add_new_field

# Update Docker configuration
# Edit docker-compose.yml or Dockerfile
docker-compose build
docker-compose up
```

### Tier 2: Implementation Tasks
```bash
# Add a new API endpoint
# 1. Create route in backend/src/routes/
# 2. Create service in backend/src/services/
# 3. Add validation schema
# 4. Write tests

# Add a new React component
# 1. Create component in frontend/src/components/
# 2. Add prop types
# 3. Style with Tailwind
# 4. Write tests

# Update business logic
# 1. Modify service file
# 2. Update tests
# 3. Update API documentation
```

### Tier 3: Quality Assurance Tasks
```bash
# Run all tests
npm test

# Check coverage
npm run test:coverage

# Run linter
npm run lint

# Security audit
npm audit

# Performance testing
npm run test:performance

# Review a PR
# 1. Use REVIEW_CHECKLIST.md
# 2. Test locally
# 3. Check documentation
# 4. Verify tests
# 5. Approve or request changes
```

---

## 📖 Quick Reference

### Git Workflow
```bash
# Start new feature
git checkout main
git pull origin main
git checkout -b feature/your-feature

# Commit changes
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature

# Create PR on GitHub
# Wait for three-tier review
# Address feedback
# Merge when approved
```

### Testing Commands
```bash
# Backend tests
cd backend
npm test                  # All tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage

# Frontend tests
cd frontend
npm test                  # All tests
npm run test:watch        # Watch mode
```

### Development Commands
```bash
# Start all services
docker-compose up

# Start backend only
cd backend && npm run dev

# Start frontend only
cd frontend && npm run dev

# Start BIM service only
cd bim && uvicorn main:app --reload

# Reset database
cd backend && npm run prisma:migrate reset
```

---

## 🆘 Getting Help

### Documentation Issues
- Check [README.md](./README.md) first
- Search [GitHub Issues](https://github.com/Installsure/installsure-new-build/issues)
- Create a new issue if needed

### Technical Questions
- Review [ARCHITECTURE.md](./ARCHITECTURE.md)
- Check [BUILD_GUIDANCE.md](./BUILD_GUIDANCE.md)
- Ask in team discussions

### Process Questions
- Review [TEAM_WORKFLOW.md](./TEAM_WORKFLOW.md)
- Check [CONTRIBUTING.md](./CONTRIBUTING.md)
- Ask your tier lead

---

## ✅ Success Criteria

You're ready to contribute when you:
- [ ] Can set up the development environment
- [ ] Understand the 3-tier workflow
- [ ] Know which tier you belong to
- [ ] Can run tests locally
- [ ] Can create a PR using the template
- [ ] Understand the review process

---

## 🎉 First Contribution

### Good First Issues
Look for issues labeled:
- `good-first-issue`
- `tier1-infrastructure` (if you're Tier 1)
- `tier2-implementation` (if you're Tier 2)
- `tier3-quality` (if you're Tier 3)
- `documentation` (good for all tiers)

### Steps for First Contribution
1. Find a good first issue
2. Comment on the issue to claim it
3. Create a branch
4. Make your changes
5. Test thoroughly
6. Create a PR
7. Respond to reviews
8. Celebrate your merge! 🎉

---

## 📈 Leveling Up

### After 1 Week
- [ ] Made your first contribution
- [ ] Reviewed 3+ PRs from other tiers
- [ ] Understand the codebase structure
- [ ] Know where to find things

### After 1 Month
- [ ] Contributed to all three tiers
- [ ] Led a code review session
- [ ] Improved documentation
- [ ] Suggested process improvements

### After 3 Months
- [ ] Mentored a new contributor
- [ ] Led a major feature
- [ ] Improved the 3-tier process
- [ ] Became a tier lead

---

## 🔗 All Documentation Links

- [README.md](./README.md) - Project overview
- [TEAM_WORKFLOW.md](./TEAM_WORKFLOW.md) - 3-tier collaboration process
- [BUILD_GUIDANCE.md](./BUILD_GUIDANCE.md) - Detailed specifications
- [REVIEW_CHECKLIST.md](./REVIEW_CHECKLIST.md) - Code review standards
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Migration instructions
- [.github/CODEOWNERS](./.github/CODEOWNERS) - Code ownership
- [.github/PULL_REQUEST_TEMPLATE.md](./.github/PULL_REQUEST_TEMPLATE.md) - PR template

---

## 💡 Pro Tips

1. **Always read the documentation first** - It saves time
2. **Ask questions early** - Don't struggle alone
3. **Small PRs are better** - Easier to review
4. **Write tests first** - It guides your implementation
5. **Document as you go** - Don't leave it for later
6. **Review others' code** - You learn more
7. **Use the templates** - They ensure completeness
8. **Communicate often** - Keep your tier informed

---

**Welcome to the team! Let's build something amazing together! 🚀**

**Version**: 1.0.0  
**Last Updated**: 2025-10-13  
**Maintained By**: InstallSure Development Team
