#!/bin/bash

# Auto-generate and create a PR using GitHub CLI
# Usage: ./scripts/create-pr.sh [target-branch]

set -e

# Default target branch is dev
TARGET_BRANCH="${1:-dev}"

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if we're on a branch
if [ "$CURRENT_BRANCH" == "main" ] || [ "$CURRENT_BRANCH" == "dev" ]; then
    echo "❌ Cannot create PR from main or dev branch"
    echo "Please switch to a feature branch"
    exit 1
fi

# Get commits that will be in the PR
COMMITS=$(git log $TARGET_BRANCH..$CURRENT_BRANCH --oneline)

if [ -z "$COMMITS" ]; then
    echo "❌ No commits to create PR from"
    exit 1
fi

echo "📝 Commits that will be included:"
echo "$COMMITS"
echo ""

# Generate PR title from branch name
# feat/setup-versioning -> feat: setup versioning
PR_TITLE=$(echo "$CURRENT_BRANCH" | sed 's/\//:/' | sed 's/-/ /g')

# Create PR with auto-generated title and body from commits
echo "🚀 Creating PR: $PR_TITLE"
echo "   Target: $TARGET_BRANCH"
echo ""

gh pr create \
  --base "$TARGET_BRANCH" \
  --title "$PR_TITLE" \
  --body "$(cat <<EOF
## Summary

Auto-generated from branch: \`$CURRENT_BRANCH\`

## Changes

$COMMITS

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated (if needed)
- [ ] No new warnings generated
- [ ] Changeset added (if applicable)

---

**Branch:** \`$CURRENT_BRANCH\` → \`$TARGET_BRANCH\`
EOF
)" \
  --assignee "@me" \
  --web

echo ""
echo "✅ PR created successfully!"

