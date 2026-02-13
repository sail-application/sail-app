#!/bin/bash
# setup.sh — First-time project setup
#
# Installs npm dependencies and creates a .env.local file from the
# example template if one doesn't already exist.
#
# Usage: bash scripts/setup.sh

set -e

echo "🚀 Setting up SAIL v2..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env.local from example if it doesn't exist
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "📝 Created .env.local from .env.example"
  echo "   → Fill in your actual values before running the app"
else
  echo "✓ .env.local already exists"
fi

echo ""
echo "✓ Setup complete! Next steps:"
echo "  1. Fill in .env.local with your actual API keys"
echo "  2. Run 'npm run dev' to start the dev server"
echo "  3. Run 'make verify' to test Docker build"
