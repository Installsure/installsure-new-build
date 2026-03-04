#!/usr/bin/env bash
# deploy-plans-upload.sh
# Deploys the Plans Upload Service to a DigitalOcean droplet.
#
# Usage:
#   DEPLOY_HOST=<droplet-ip> DEPLOY_USER=<user> ./scripts/deploy-plans-upload.sh
#
# Environment variables:
#   DEPLOY_HOST      – target droplet IP or hostname (required)
#   DEPLOY_USER      – SSH user (default: root)
#   DEPLOY_DIR       – remote deploy directory (default: /opt/installsure)
#   DB_MIGRATE       – run database migrations before restart (default: true)
#   RUN_TESTS        – run tests before deploy (default: true)
#   ROLLBACK_ON_FAIL – rollback to previous release on failure (default: true)

set -euo pipefail

# ─── Configuration ─────────────────────────────────────────────────────────

DEPLOY_HOST="${DEPLOY_HOST:?DEPLOY_HOST is required}"
DEPLOY_USER="${DEPLOY_USER:-root}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/installsure}"
DB_MIGRATE="${DB_MIGRATE:-true}"
RUN_TESTS="${RUN_TESTS:-true}"
ROLLBACK_ON_FAIL="${ROLLBACK_ON_FAIL:-true}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RELEASE_DIR="${DEPLOY_DIR}/releases/${TIMESTAMP}"
CURRENT_LINK="${DEPLOY_DIR}/current"
LOG_FILE="/tmp/deploy-plans-upload-${TIMESTAMP}.log"

SSH_OPTS="-o StrictHostKeyChecking=no -o BatchMode=yes"
SSH="ssh ${SSH_OPTS} ${DEPLOY_USER}@${DEPLOY_HOST}"
SCP="scp ${SSH_OPTS}"

# ─── Helpers ───────────────────────────────────────────────────────────────

log()  { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG_FILE"; }
err()  { echo "[$(date '+%H:%M:%S')] ERROR: $*" | tee -a "$LOG_FILE" >&2; }
step() { log "▸ $*"; }

rollback() {
  err "Deployment failed – initiating rollback"
  $SSH "
    set -e
    PREV=\$(readlink -f ${CURRENT_LINK}/.. | xargs -I{} ls -t {} | grep -v current | head -1 || true)
    if [ -n \"\$PREV\" ]; then
      ln -sfn \"\${PREV}\" \"${CURRENT_LINK}\"
      cd \"${CURRENT_LINK}\"
      npm run --prefix backend start &
      sleep 3
      echo 'Rollback complete'
    else
      echo 'No previous release found – cannot rollback'
    fi
  " 2>&1 | tee -a "$LOG_FILE" || true
}

cleanup() {
  local exit_code=$?
  if [ $exit_code -ne 0 ] && [ "$ROLLBACK_ON_FAIL" = "true" ]; then
    rollback
  fi
  log "Deploy log saved to ${LOG_FILE}"
}
trap cleanup EXIT

# ─── Pre-deploy: local tests ───────────────────────────────────────────────

if [ "$RUN_TESTS" = "true" ]; then
  step "Running backend tests"
  cd "$(dirname "$0")/../backend"
  npm ci --silent
  npm test 2>&1 | tee -a "$LOG_FILE"
  log "Tests passed ✓"
  cd -
fi

# ─── Package release ───────────────────────────────────────────────────────

step "Building backend"
cd "$(dirname "$0")/../backend"
npm ci --silent
npm run build 2>&1 | tee -a "$LOG_FILE"
log "Build complete ✓"

step "Creating release archive"
tar czf "/tmp/release-${TIMESTAMP}.tar.gz" \
  --exclude='node_modules' \
  --exclude='.env' \
  --exclude='uploads' \
  dist/ package.json package-lock.json prisma/ scripts/ 2>&1 | tee -a "$LOG_FILE"

# ─── Remote deploy ─────────────────────────────────────────────────────────

step "Creating remote release directory: ${RELEASE_DIR}"
$SSH "mkdir -p ${RELEASE_DIR}/logs"

step "Uploading release archive"
$SCP "/tmp/release-${TIMESTAMP}.tar.gz" "${DEPLOY_USER}@${DEPLOY_HOST}:${RELEASE_DIR}/release.tar.gz"

step "Extracting release on remote"
$SSH "
  set -e
  cd ${RELEASE_DIR}
  tar xzf release.tar.gz
  rm release.tar.gz
  npm ci --omit=dev --silent
  cp ${CURRENT_LINK}/.env ${RELEASE_DIR}/.env 2>/dev/null || true
  cp -r ${CURRENT_LINK}/uploads ${RELEASE_DIR}/uploads 2>/dev/null || true
"

# ─── Database migration ────────────────────────────────────────────────────

if [ "$DB_MIGRATE" = "true" ]; then
  step "Running database migrations"
  $SSH "
    set -e
    cd ${RELEASE_DIR}
    source .env 2>/dev/null || true
    # Apply plain SQL migrations (incremental)
    for f in \$(ls migrations/*.sql | sort); do
      echo \"Applying \$f\"
      psql \"\${DATABASE_URL}\" -f \"\$f\" 2>&1
    done
    # Apply Prisma migrations if prisma is configured
    if [ -d prisma/migrations ]; then
      npx prisma migrate deploy --schema=prisma/schema.prisma 2>&1 || true
    fi
  " 2>&1 | tee -a "$LOG_FILE"
  log "Migrations complete ✓"
fi

# ─── Atomic symlink swap ───────────────────────────────────────────────────

step "Activating new release"
$SSH "
  set -e
  ln -sfn ${RELEASE_DIR} ${CURRENT_LINK}
  echo 'Symlink updated'
"

# ─── Service restart & health check ───────────────────────────────────────

step "Restarting application service"
$SSH "
  set -e
  cd ${CURRENT_LINK}
  # Try systemd first, fall back to PM2
  if systemctl is-active installsure-backend &>/dev/null; then
    systemctl restart installsure-backend
  elif command -v pm2 &>/dev/null; then
    pm2 restart installsure-backend || pm2 start dist/index.js --name installsure-backend
    pm2 save
  else
    pkill -f 'node dist/index.js' || true
    nohup node dist/index.js > logs/app.log 2>&1 &
    sleep 2
  fi
" 2>&1 | tee -a "$LOG_FILE"

step "Running health check"
MAX_ATTEMPTS=10
for i in $(seq 1 $MAX_ATTEMPTS); do
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://${DEPLOY_HOST}:8000/api/health" || echo "000")
  if [ "$HTTP_STATUS" = "200" ]; then
    log "Health check passed ✓ (attempt ${i})"
    break
  fi
  if [ "$i" = "$MAX_ATTEMPTS" ]; then
    err "Health check failed after ${MAX_ATTEMPTS} attempts (last status: ${HTTP_STATUS})"
    exit 1
  fi
  log "Health check attempt ${i}/${MAX_ATTEMPTS}: HTTP ${HTTP_STATUS} – retrying in 5s"
  sleep 5
done

# ─── Cleanup old releases (keep last 5) ───────────────────────────────────

step "Pruning old releases"
$SSH "
  cd ${DEPLOY_DIR}/releases
  ls -t | tail -n +6 | xargs -r rm -rf
  echo 'Old releases pruned'
" 2>&1 | tee -a "$LOG_FILE"

# ─── Done ──────────────────────────────────────────────────────────────────

log ""
log "╔══════════════════════════════════════╗"
log "║  Deployment successful ✓             ║"
log "║  Release: ${TIMESTAMP}        ║"
log "╚══════════════════════════════════════╝"
rm -f "/tmp/release-${TIMESTAMP}.tar.gz"
