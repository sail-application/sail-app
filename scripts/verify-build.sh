#!/bin/bash
# verify-build.sh — Verify the project builds cleanly
#
# Runs lint, TypeScript type checking, and a production build in sequence.
# If any step fails, the script exits immediately (set -e).
#
# Usage: bash scripts/verify-build.sh

set -e

echo "🔍 Running build verification..."

npm run lint && echo "✓ Lint passed"
npx tsc --noEmit && echo "✓ TypeScript check passed"
npm run build && echo "✓ Build passed"

echo "✓ All checks passed!"
