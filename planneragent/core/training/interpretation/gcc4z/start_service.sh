#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
: "${STUDENT_BEARER_TOKEN:?STUDENT_BEARER_TOKEN required}"
: "${STUDENT_ARTIFACT_PATH:?STUDENT_ARTIFACT_PATH required}"
export STUDENT_DTYPE=bf16 STUDENT_MAX_CONCURRENCY=1 STUDENT_MAX_REQUEST_BYTES=16384 STUDENT_CACHE_ROOT="${STUDENT_CACHE_ROOT:-$ROOT/.runtime}"
cd "$ROOT/service"
exec "$ROOT/.venv/bin/python" -m uvicorn app.main:app --host 127.0.0.1 --port "${STUDENT_PORT:-8080}" --workers 1 --no-access-log
