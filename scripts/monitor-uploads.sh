#!/usr/bin/env bash
# monitor-uploads.sh
# Monitors the Plans Upload Service for errors, disk space, and latency.
#
# Usage:
#   ./scripts/monitor-uploads.sh [--once] [--json]
#
# Options:
#   --once  Run a single check and exit (useful for cron / alerting pipelines)
#   --json  Output metrics as JSON instead of human-readable text
#
# Environment variables:
#   API_BASE          – API base URL (default: http://localhost:8000)
#   UPLOAD_DIR        – directory where plan files are stored (default: ./uploads/plans)
#   DISK_WARN_PCT     – % disk usage at which to warn (default: 80)
#   DISK_CRIT_PCT     – % disk usage at which to alert critical (default: 90)
#   LATENCY_WARN_MS   – upload API latency warning threshold in ms (default: 2000)
#   CHECK_INTERVAL_S  – seconds between checks in continuous mode (default: 60)
#   LOG_FILE          – path to log file (default: /tmp/upload-monitor.log)

set -euo pipefail

API_BASE="${API_BASE:-http://localhost:8000}"
UPLOAD_DIR="${UPLOAD_DIR:-./uploads/plans}"
DISK_WARN_PCT="${DISK_WARN_PCT:-80}"
DISK_CRIT_PCT="${DISK_CRIT_PCT:-90}"
LATENCY_WARN_MS="${LATENCY_WARN_MS:-2000}"
CHECK_INTERVAL_S="${CHECK_INTERVAL_S:-60}"
LOG_FILE="${LOG_FILE:-/tmp/upload-monitor.log}"

MODE="continuous"
OUTPUT="text"

for arg in "$@"; do
  case "$arg" in
    --once) MODE="once" ;;
    --json) OUTPUT="json" ;;
  esac
done

# ─── Helpers ───────────────────────────────────────────────────────────────

ts() { date '+%Y-%m-%dT%H:%M:%SZ'; }

log_line() {
  echo "[$(ts)] $*" | tee -a "$LOG_FILE"
}

emit_alert() {
  local level="$1" message="$2"
  log_line "[${level}] ALERT: ${message}"
  # Hook for PagerDuty / Slack / e-mail – add integrations here
  # e.g.  curl -s -X POST "$PAGERDUTY_EVENTS_URL" --data "{...}"
}

# ─── Checks ────────────────────────────────────────────────────────────────

check_health() {
  local start end latency_ms status
  start=$(date +%s%3N)
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${API_BASE}/api/health" 2>/dev/null || echo "000")
  end=$(date +%s%3N)
  latency_ms=$(( end - start ))

  if [ "$status" != "200" ]; then
    emit_alert "CRITICAL" "Health endpoint returned HTTP ${status}"
  elif [ "$latency_ms" -gt "$LATENCY_WARN_MS" ]; then
    emit_alert "WARNING" "Health endpoint latency ${latency_ms}ms exceeds threshold ${LATENCY_WARN_MS}ms"
  fi

  echo "${status}|${latency_ms}"
}

check_disk() {
  local dir="${UPLOAD_DIR}"
  [ -d "$dir" ] || mkdir -p "$dir"

  # df output: Filesystem 1K-blocks Used Available Use% Mounted-on
  local use_pct
  use_pct=$(df "$dir" 2>/dev/null | awk 'NR==2 {gsub(/%/,""); print $5}' || echo "0")

  if [ "$use_pct" -ge "$DISK_CRIT_PCT" ]; then
    emit_alert "CRITICAL" "Disk usage at ${use_pct}% (critical threshold: ${DISK_CRIT_PCT}%)"
  elif [ "$use_pct" -ge "$DISK_WARN_PCT" ]; then
    emit_alert "WARNING" "Disk usage at ${use_pct}% (warning threshold: ${DISK_WARN_PCT}%)"
  fi

  local avail_kb
  avail_kb=$(df "$dir" 2>/dev/null | awk 'NR==2 {print $4}' || echo "0")
  echo "${use_pct}|${avail_kb}"
}

check_upload_errors() {
  # Tail the application log for recent upload errors
  # This assumes pino-formatted JSON logs; adapt as needed.
  local log_path="${UPLOAD_DIR%/plans}/app.log"
  local error_count=0

  if [ -f "$log_path" ]; then
    # Count error-level entries from the last 5 minutes containing 'plans-upload'
    local since
    since=$(date -d '5 minutes ago' '+%s' 2>/dev/null || date -v-5M '+%s' 2>/dev/null || echo "0")
    error_count=$(awk -v since="$since" '
      /plans-upload/ && /"level":50/ {
        match($0, /"time":([0-9]+)/, arr)
        if (arr[1]/1000 >= since) count++
      }
      END { print count+0 }
    ' "$log_path" 2>/dev/null || echo 0)

    if [ "$error_count" -gt 5 ]; then
      emit_alert "WARNING" "${error_count} upload errors in the last 5 minutes"
    fi
  fi

  echo "$error_count"
}

run_checks() {
  local health_result disk_result error_count
  health_result=$(check_health)
  disk_result=$(check_disk)
  error_count=$(check_upload_errors)

  local http_status latency_ms disk_pct avail_kb
  IFS='|' read -r http_status latency_ms <<< "$health_result"
  IFS='|' read -r disk_pct avail_kb <<< "$disk_result"

  if [ "$OUTPUT" = "json" ]; then
    printf '{"timestamp":"%s","health":{"status":%s,"latency_ms":%s},"disk":{"use_pct":%s,"available_kb":%s},"upload_errors_5m":%s}\n' \
      "$(ts)" "$http_status" "$latency_ms" "$disk_pct" "$avail_kb" "$error_count"
  else
    log_line "Health: HTTP ${http_status} (${latency_ms}ms) | Disk: ${disk_pct}% used (${avail_kb} KB free) | Upload errors (5m): ${error_count}"
  fi
}

# ─── Main loop ─────────────────────────────────────────────────────────────

if [ "$MODE" = "once" ]; then
  run_checks
else
  log_line "Starting upload monitor (interval: ${CHECK_INTERVAL_S}s, log: ${LOG_FILE})"
  while true; do
    run_checks
    sleep "$CHECK_INTERVAL_S"
  done
fi
