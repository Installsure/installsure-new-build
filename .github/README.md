# 🔧 GitHub Configuration Files

This directory contains GitHub-specific configuration files that enhance the 3-tier collaborative development workflow.

---

## 📁 Files Overview

### CODEOWNERS
**Purpose**: Automatically assign reviewers based on file paths

**How it works**:
- When a PR is created, GitHub automatically requests reviews from owners
- Different tiers own different parts of the codebase
- Critical files require approval from all three tiers

**Usage**:
- No action needed - GitHub handles this automatically
- Update this file when adding new major components
- Replace tier labels with actual GitHub usernames/teams

**Example**:
```
/backend/src/lib/     @tier1-infrastructure @tier2-implementation
/frontend/src/pages/  @tier2-implementation
/docs/                @tier3-quality
```

---

### PULL_REQUEST_TEMPLATE.md
**Purpose**: Standardized PR template with tier review sections

**How it works**:
- Automatically populates when creating a new PR
- Provides checklist for submitting changes
- Includes sections for each tier's review

**Best Practices**:
- Fill out all sections completely
- Check all applicable boxes
- Link related issues
- Add screenshots for UI changes
- Wait for all three tiers to approve

---

### ISSUE_TEMPLATE/

#### bug_report.md
**Purpose**: Structured bug reporting

**When to use**:
- Something is broken or not working as expected
- Error messages appear
- Unexpected behavior occurs

**Key sections**:
- Bug description
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Error logs

#### feature_request.md
**Purpose**: Propose new features

**When to use**:
- Requesting new functionality
- Suggesting improvements
- Proposing architectural changes

**Key sections**:
- Feature description
- Problem statement
- Implementation considerations
- Impact analysis
- Acceptance criteria

#### tier_review.md
**Purpose**: Request comprehensive 3-tier code review

**When to use**:
- Major architectural changes
- Pre-production deployment
- Security-sensitive changes
- Performance-critical updates

**Key sections**:
- Review scope
- Tier-specific checklists
- Reviewer sign-off sections
- Final approval criteria

---

## 🎯 How to Use These Templates

### For Pull Requests

1. Create a new branch for your work
2. Make your changes
3. Push to GitHub
4. Click "Create Pull Request"
5. The PR template auto-fills
6. Complete all sections
7. Submit for review
8. Respond to feedback from all three tiers

### For Issues

1. Navigate to Issues tab
2. Click "New Issue"
3. Choose appropriate template:
   - 🐛 Bug Report - for bugs
   - 💡 Feature Request - for features
   - 🔍 Tier Review - for comprehensive reviews
4. Fill out the template
5. Submit

---

## 🔄 Customization Guide

### Updating CODEOWNERS

When to update:
- New major component added
- Responsibility boundaries change
- Team structure changes

How to update:
```
# Format: <file-pattern> @owner1 @owner2

# Add your new pattern
/new-component/  @tier2-implementation

# Update ownership
/backend/api/    @tier1-infrastructure @tier2-implementation
```

### Modifying Templates

Templates are in Markdown format. To modify:

1. Edit the template file
2. Test with a sample PR/issue
3. Commit changes
4. Template updates immediately

---

## 🚀 Workflow Integration

### Pull Request Workflow

```
Developer creates PR
       ↓
Template auto-fills
       ↓
Developer completes checklist
       ↓
CODEOWNERS assigns reviewers
       ↓
Tier 1 reviews infrastructure
       ↓
Tier 2 reviews implementation
       ↓
Tier 3 reviews quality
       ↓
All approve → Merge
```

### Issue Workflow

```
User encounters problem/has idea
       ↓
Creates issue with template
       ↓
Team triages
       ↓
Assigns to appropriate tier
       ↓
Development begins
       ↓
Links to PR when fixed
       ↓
Closes when merged
```

---

## 📚 Related Documentation

- [TEAM_WORKFLOW.md](../TEAM_WORKFLOW.md) - Collaboration process
- [BUILD_GUIDANCE.md](../BUILD_GUIDANCE.md) - Technical specifications
- [REVIEW_CHECKLIST.md](../REVIEW_CHECKLIST.md) - Review standards
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contribution guidelines

---

## 💡 Tips & Best Practices

### For PR Authors
- ✅ Complete all sections of the template
- ✅ Link related issues
- ✅ Add screenshots for UI changes
- ✅ Self-review before submitting
- ✅ Keep PRs small and focused

### For Reviewers
- ✅ Use the tier-specific checklist
- ✅ Provide constructive feedback
- ✅ Approve only when confident
- ✅ Request changes if needed
- ✅ Re-review after changes made

### For Issue Creators
- ✅ Choose correct template
- ✅ Provide complete information
- ✅ Include reproduction steps
- ✅ Add environment details
- ✅ Search for duplicates first

---

## 🔍 Troubleshooting

### Template Not Loading
**Problem**: PR/Issue template doesn't auto-fill

**Solutions**:
1. Refresh the page
2. Clear browser cache
3. Try incognito mode
4. Check template file syntax

### CODEOWNERS Not Working
**Problem**: Reviewers not automatically assigned

**Solutions**:
1. Verify file is named exactly `CODEOWNERS`
2. Check file is in `.github/` directory
3. Ensure GitHub usernames are correct
4. Enable "Require review from Code Owners" in branch protection

### Wrong Reviewers Assigned
**Problem**: Incorrect people assigned to PR

**Solutions**:
1. Check CODEOWNERS file patterns
2. Verify file paths match patterns
3. Update patterns if needed
4. Manually add/remove reviewers as needed

---

## 📈 Continuous Improvement

These templates and configurations should evolve with the project:

### Monthly Review
- [ ] Check if templates are being used correctly
- [ ] Gather feedback on template usability
- [ ] Update based on common issues

### Quarterly Update
- [ ] Review CODEOWNERS accuracy
- [ ] Update templates with new sections if needed
- [ ] Align with process improvements

### Annual Overhaul
- [ ] Major template revision
- [ ] Restructure based on lessons learned
- [ ] Update to match new workflows

---

## 🎉 Success Metrics

Templates are working well when:

- ✅ PRs consistently use the template
- ✅ Issues are properly categorized
- ✅ Review assignments are accurate
- ✅ All three tiers participate in reviews
- ✅ Documentation stays current

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-13  
**Maintained By**: InstallSure Development Team
