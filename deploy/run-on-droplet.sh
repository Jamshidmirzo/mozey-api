#!/usr/bin/env bash
# Mozey production deploy — run directly on the droplet (web console / SSH).
#
# Layout (discovered 2026-06-20):
#   /opt/mozey/docker-compose.yml      ← single prod compose with all 6 services
#   /opt/mozey/api/                    ← source dir for the api service
#   /opt/mozey/admin/                  ← source dir for the admin service
#   /opt/mozey/landing/                ← source dir for the landing service
#
# What it does (idempotent):
#   1. Sync /opt/mozey/{api,admin,landing} source dirs from origin/main.
#      Preserves untracked files (.env, certs, minio data).
#   2. Rebuild + restart api, admin, landing from the SINGLE prod compose
#      (/opt/mozey/docker-compose.yml). The api entrypoint runs
#      `npx prisma migrate deploy` on container start.
#   3. Smoke-test public endpoints.

set -euo pipefail

API_REPO=https://github.com/Jamshidmirzo/mozey-api.git
ADMIN_REPO=https://github.com/Jamshidmirzo/mozey-admin.git
LANDING_REPO=https://github.com/Jamshidmirzo/mozey.git

ROOT=/opt/mozey
COMPOSE="docker compose -f $ROOT/docker-compose.yml"

log() { printf "\n\033[1;36m▶ %s\033[0m\n" "$*"; }
ok()  { printf "\033[1;32m  ✓ %s\033[0m\n" "$*"; }
err() { printf "\033[1;31m  ✗ %s\033[0m\n" "$*" >&2; }

ensure_git() {
  local dir=$1 repo=$2
  log "git: $dir"
  cd "$dir"
  [ -d .git ] || git init -b main >/dev/null
  git remote remove origin 2>/dev/null || true
  git remote add origin "$repo"
  git fetch --prune origin main
  git reset --hard origin/main
  ok "synced to $(git rev-parse --short HEAD)"
}

# ----- 1. Sync source ---------------------------------------------------------
ensure_git "$ROOT/api"     "$API_REPO"
ensure_git "$ROOT/admin"   "$ADMIN_REPO"
ensure_git "$ROOT/landing" "$LANDING_REPO"

# ----- 2. Rebuild + restart from the single prod compose ----------------------
log "build api"
$COMPOSE build api

log "build admin"
$COMPOSE build admin

log "build landing"
$COMPOSE build landing

log "restart api (entrypoint runs prisma migrate deploy)"
$COMPOSE up -d --no-deps api

sleep 6
if curl -sf https://api.mozey.uz/api/v1/health >/dev/null; then
  ok "api /health OK"
else
  err "api /health FAILED — check logs: $COMPOSE logs --tail=50 api"
  exit 1
fi
if curl -s "https://api.mozey.uz/api/v1/museums?limit=1" | grep -q '"links"'; then
  ok "museums response includes links[]"
else
  err "links[] missing — migration may not have run; check: $COMPOSE logs api | grep -i prisma"
fi

log "restart admin"
$COMPOSE up -d --no-deps admin
sleep 5
admin_code=$(curl -s -o /dev/null -w "%{http_code}" https://admin.mozey.uz/)
case "$admin_code" in
  200|301|302|307|308) ok "admin HTTP $admin_code" ;;
  *)                   err "admin HTTP $admin_code — $COMPOSE logs --tail=50 admin" ;;
esac

log "restart landing"
$COMPOSE up -d --no-deps landing
sleep 5
landing_code=$(curl -s -o /dev/null -w "%{http_code}" https://mozey.uz/ru)
case "$landing_code" in
  200|301|302|307|308) ok "landing HTTP $landing_code" ;;
  *)                   err "landing HTTP $landing_code — $COMPOSE logs --tail=50 landing" ;;
esac

log "DONE"
echo "Verify in browser:"
echo "  • https://api.mozey.uz/api/v1/museums?limit=1   (must include 'links')"
echo "  • https://admin.mozey.uz                         (create a museum with photo)"
echo "  • https://mozey.uz/ru                            (museum with multiple photos → thumbnail strip)"
