#!/bin/bash

# Create a PR using GitHub CLI
# Usage: ./scripts/create-pr.sh [target-branch] [--skip-checks]

set -e

TARGET_BRANCH="${1:-main}"
SKIP_CHECKS=false

# Parse flags
for arg in "$@"; do
    case $arg in
        --skip-checks)
            SKIP_CHECKS=true
            ;;
    esac
done

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if we're on a branch
if [ "$CURRENT_BRANCH" == "main" ]; then
    echo "❌ Cannot create PR from main branch"
    exit 1
fi

# Run pre-PR checks (unless skipped)
if [ "$SKIP_CHECKS" != "true" ]; then
    if ! pnpm pre-pr; then
        echo ""
        echo "❌ Pre-PR checks failed. Fix issues or use --skip-checks"
        exit 1
    fi
    echo ""
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
- [ ] Pre-PR checks passed

---

**Branch:** \`$CURRENT_BRANCH\` → \`$TARGET_BRANCH\`
EOF
)" \
  --assignee "@me" \
  --web

echo ""
echo "✅ PR created successfully!"

