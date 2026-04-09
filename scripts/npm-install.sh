#!/bin/bash
set -e
if [ -f .env ]; then
  GITHUB_TOKEN=$(grep "^GITHUB_TOKEN=" .env | head -1 | cut -d'=' -f2-)
  export GITHUB_TOKEN
fi
if [ -z "$GITHUB_TOKEN" ]; then
  echo "Error: GITHUB_TOKEN not set in .env or environment"
  exit 1
fi
npm install "$@"
