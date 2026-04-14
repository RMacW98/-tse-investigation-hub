#!/bin/bash
# PSE Hub - Next.js Web UI
# Usage: ./web/run.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

echo ""
echo "  PSE Hub (Next.js) starting at http://localhost:5099"
echo "  Workspace: $(cd .. && pwd)"
echo ""

npm run dev
