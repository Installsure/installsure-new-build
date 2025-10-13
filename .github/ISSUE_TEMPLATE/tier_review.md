---
name: 🔍 3-Tier Code Review
about: Request a comprehensive 3-tier code review
title: '[REVIEW] '
labels: review
assignees: ''
---

## 📝 Review Request

### Code Location
<!-- Link to PR, branch, or specific files -->
- **PR**: #
- **Branch**: 
- **Files**: 

### Review Type
<!-- Check all that apply -->
- [ ] 🏗️ Infrastructure Review (config, build, deployment)
- [ ] 💼 Implementation Review (code logic, features)
- [ ] 🛡️ Quality Review (security, performance, tests)
- [ ] 🔄 Complete 3-Tier Review (all tiers)

## 🎯 Review Scope

### What Changed?
<!-- Brief description of changes -->


### Why Review Needed?
<!-- Why are you requesting this review? -->
- [ ] New feature implementation
- [ ] Bug fix validation
- [ ] Performance concerns
- [ ] Security concerns
- [ ] Architecture decisions
- [ ] Pre-production deployment
- [ ] Other: 

## 📋 Tier 1: Infrastructure Review Checklist

### Configuration
- [ ] Build configuration valid
- [ ] Dependencies properly managed
- [ ] Environment variables documented
- [ ] Docker configuration correct

### Database
- [ ] Schema changes reviewed
- [ ] Migrations tested
- [ ] Indexes optimized
- [ ] No breaking changes

### Deployment
- [ ] CI/CD pipeline updated
- [ ] Deployment scripts valid
- [ ] Resource requirements defined
- [ ] Rollback plan documented

**Tier 1 Reviewer**: <!-- @tier1-infrastructure -->  
**Status**: <!-- Pending / In Progress / Approved / Changes Required -->  
**Comments**:


## 📋 Tier 2: Implementation Review Checklist

### Code Quality
- [ ] TypeScript types proper
- [ ] No code duplication
- [ ] Error handling comprehensive
- [ ] Logging appropriate

### Functionality
- [ ] Requirements met
- [ ] Business logic sound
- [ ] API contracts followed
- [ ] Edge cases handled

### Testing
- [ ] Unit tests present
- [ ] Integration tests added
- [ ] Test coverage adequate
- [ ] Manual testing done

**Tier 2 Reviewer**: <!-- @tier2-implementation -->  
**Status**: <!-- Pending / In Progress / Approved / Changes Required -->  
**Comments**:


## 📋 Tier 3: Quality Assurance Checklist

### Security
- [ ] No vulnerabilities introduced
- [ ] Authentication/authorization correct
- [ ] Input validation present
- [ ] Sensitive data protected

### Performance
- [ ] No performance degradation
- [ ] Queries optimized
- [ ] Caching appropriate
- [ ] Resource usage acceptable

### Documentation
- [ ] Code comments adequate
- [ ] API docs updated
- [ ] README updated if needed
- [ ] Migration guide provided

### Testing
- [ ] Test coverage ≥80%
- [ ] Critical paths tested
- [ ] E2E tests for flows
- [ ] No flaky tests

**Tier 3 Reviewer**: <!-- @tier3-quality -->  
**Status**: <!-- Pending / In Progress / Approved / Changes Required -->  
**Comments**:


## 🔍 Specific Areas of Concern
<!-- Highlight any specific areas you want reviewers to focus on -->


## 📊 Review Results

### Critical Issues Found
<!-- Issues that must be fixed -->
1. 

### High Priority Issues
<!-- Issues that should be fixed -->
1. 

### Medium Priority Issues
<!-- Issues that can be fixed later -->
1. 

### Recommendations
<!-- General improvements suggested -->
1. 

## ✅ Final Approval

- [ ] All three tiers have approved
- [ ] All critical issues resolved
- [ ] All high priority issues resolved or have plan
- [ ] Documentation complete
- [ ] Ready for merge

**Approved By**:
- Tier 1: <!-- name, date -->
- Tier 2: <!-- name, date -->
- Tier 3: <!-- name, date -->

## 📝 Additional Notes


---

**Review Guidelines**: See [REVIEW_CHECKLIST.md](../../REVIEW_CHECKLIST.md) for detailed checklist.
