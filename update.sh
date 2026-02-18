#!/bin/bash
# Pull latest from GitHub and rebuild the Docker container
# Usage: ./update.sh

set -e

REPO="thejrudd/nfl-predictor"
BRANCH="main"
DIR="nfl-predictor-main"

echo "Stopping current container..."
docker compose down 2>/dev/null || true
docker rm -f nfl-predictor 2>/dev/null || true

echo "Downloading latest from GitHub..."
cd "$(dirname "$0")/.."
rm -rf "$DIR"
curl -sL "https://github.com/$REPO/archive/refs/heads/$BRANCH.tar.gz" | tar xz

echo "Rebuilding and starting container..."
cd "$DIR"
docker compose up -d --build

echo "Done! App is running."
docker ps --filter name=nfl-predictor --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
