#!/usr/bin/env bash
# Mozey production deploy — run directly on the droplet (web console / SSH).
#
# What it does (idempotent):
#   1. Convert /opt/mozey/{api,admin,landing} to git checkouts if they aren't
#      already (preserves untracked files like .env, certs, minio data).
#   2. Fetch + hard-reset each to origin/main.
#   3. Apply Prisma migrations (creates museum_links if missing).
#   4. Rebuild + restart each docker service.
#   5. Smoke-test.
#
# Run on the droplet:
#   curl -sSL https://raw.githubusercontent.com/Jamshidmirzo/mozey-api/main/deploy/run-on-droplet.sh | bash

set -euo pipefail

API_REPO=https://github.com/Jamshidmirzo/mozey-api.git
ADMIN_REPO=https://github.com/Jamshidmirzo/mozey-admin.git
LANDING_REPO=https://github.com/Jamshidmirzo/mozey.git

API_DIR=/opt/mozey/api
ADMIN_DIR=/opt/mozey/admin
LANDING_DIR=/opt/mozey/landing

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
  # Hard-reset tracked files to origin/main. Untracked files (.env, certs, etc.) survive.
  git reset --hard origin/main
  ok "synced to $(git rev-parse --short HEAD)"
}

# ----- 1. API ----------------------------------------------------------------
ensure_git "$API_DIR" "$API_REPO"

log "prisma migrate deploy"
docker compose -f "$API_DIR/docker-compose.yml" run --rm api npx prisma migrate deploy
docker compose -f "$API_DIR/docker-compose.yml" run --rm api npx prisma generate >/dev/null

log "rebuild api"
docker compose -f "$API_DIR/docker-compose.yml" build api
docker compose -f "$API_DIR/docker-compose.yml" up -d api

sleep 4
if curl -sf https://api.mozey.uz/api/v1/health >/dev/null; then
  ok "api /health OK"
else
  err "api /health FAILED"
fi
if curl -s "https://api.mozey.uz/api/v1/museums?limit=1" | grep -q '"links"'; then
  ok "museums response includes links[]"
else
  err "links[] still missing — check migration"
fi

# ----- 2. Admin --------------------------------------------------------------
ensure_git "$ADMIN_DIR" "$ADMIN_REPO"

log "rebuild admin"
docker compose -f "$ADMIN_DIR/docker-compose.yml" build admin
docker compose -f "$ADMIN_DIR/docker-compose.yml" up -d admin

sleep 4
admin_code=$(curl -s -o /dev/null -w "%{http_code}" https://admin.mozey.uz/)
case "$admin_code" in
  200|301|302|307|308) ok "admin HTTP $admin_code" ;;
  *)                   err "admin HTTP $admin_code" ;;
esac

# ----- 3. Landing ------------------------------------------------------------
ensure_git "$LANDING_DIR" "$LANDING_REPO"

log "rebuild landing"
docker compose -f "$LANDING_DIR/docker-compose.yml" build landing
docker compose -f "$LANDING_DIR/docker-compose.yml" up -d landing

sleep 4
landing_code=$(curl -s -o /dev/null -w "%{http_code}" https://mozey.uz/ru)
case "$landing_code" in
  200|301|302|307|308) ok "landing HTTP $landing_code" ;;
  *)                   err "landing HTTP $landing_code" ;;
esac

log "DONE"
echo "Verify in browser:"
echo "  • https://api.mozey.uz/api/v1/museums?limit=1   (must include 'links')"
echo "  • https://admin.mozey.uz                         (create a museum with photo)"
echo "  • https://mozey.uz/ru                            (museum with multiple photos shows thumbnail strip)"
