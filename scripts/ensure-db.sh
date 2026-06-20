#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed. Install Docker Desktop to run the full stack."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker is not running. Start Docker Desktop, then run npm run dev:stack again."
  exit 1
fi

echo "Starting Postgres..."
if docker compose --env-file docker-compose.env up -d --wait 2>/dev/null; then
  echo "Postgres is healthy."
else
  docker compose --env-file docker-compose.env up -d
  echo "Waiting for Postgres..."
  for i in $(seq 1 45); do
    if docker compose --env-file docker-compose.env exec -T postgres pg_isready -U board -d board_governance >/dev/null 2>&1; then
      echo "Postgres is ready."
      break
    fi
    if [ "$i" -eq 45 ]; then
      echo "Postgres did not become ready in time."
      exit 1
    fi
    sleep 1
  done
fi

echo "Running migrations..."
npm run db:migrate
echo "Database ready."
