#!/usr/bin/env bash
# Regresja API dla Fazy 4.1 (backend na :3001, MOCK_MODE=true)
set -euo pipefail
BASE="${BACKEND_URL:-http://localhost:3001}/api/v1"

echo "=== Faza 4.1 — verify-nip ==="
curl -sf -X POST "$BASE/verify-nip" -H "Content-Type: application/json" -d '{"nip":"6310000000"}' | jq -e '.data.status == "active"' >/dev/null
echo "OK 6310000000 -> active"

curl -sf -X POST "$BASE/verify-nip" -H "Content-Type: application/json" -d '{"nip":"9991234567"}' | jq -e '.data.status == "suspended"' >/dev/null
echo "OK 9991234567 -> suspended"

curl -sf -X POST "$BASE/verify-nip" -H "Content-Type: application/json" -d '{"nip":"1111111111"}' | jq -e '.data.status == "deleted"' >/dev/null
echo "OK 1111111111 -> deleted"

curl -sf -X POST "$BASE/verify-nip" -H "Content-Type: application/json" -d '{"nip":"7777777777"}' | jq -e '.data.registrySource == "ceidg" and .data.type == "jd"' >/dev/null
echo "OK 7777777777 (JDG mock) -> registrySource ceidg"

code=$(curl -s -o /tmp/n404.json -w "%{http_code}" -X POST "$BASE/verify-nip" -H "Content-Type: application/json" -d '{"nip":"0000000000"}')
test "$code" = "404" && echo "OK 0000000000 -> 404" || { echo "FAIL expected 404 got $code"; exit 1; }

echo ""
echo "=== issue-cert + verify (5262562610 / PKO mock) ==="
CERT=$(curl -s -X POST "$BASE/issue-cert" -H "Content-Type: application/json" -d '{"nip":"5262562610"}' | jq -r '.certId')
curl -sf "$BASE/verify/$CERT" | jq -e '.company.status == "active"' >/dev/null
echo "OK verify GET $CERT -> active"

echo ""
echo "Wszystkie testy API zakończone powodzeniem."
