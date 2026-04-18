#!/usr/bin/env bash
# Zatrzymuje procesy nasłuchujące na portach frontu (3000) i API (3001).
set -euo pipefail

PORTS="${1:-3000 3001}"

for port in $PORTS; do
  pids=$(lsof -ti ":$port" 2>/dev/null || true)
  if [ -n "${pids:-}" ]; then
    echo "Port $port — zatrzymuję PID: $pids"
    kill -9 $pids
  else
    echo "Port $port — wolny"
  fi
done

echo "Gotowe. Sprawdzenie:"
for port in $PORTS; do
  lsof -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || echo "  $port: brak nasłuchu"
done
