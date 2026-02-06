#!/usr/bin/env bash
set -euo pipefail

# Usage: API_KEY=... HOST=... EMAIL=... PASSWORD=... ./scripts/test-auth.sh
# Defaults (override via env vars)
API_KEY="${API_KEY:-AIzaSyDETO0ohxe5Hmu5XBoWwZrnGbLNQ5fYdTk}"
HOST="${HOST:-http://127.0.0.1:9002}"
EMAIL="${EMAIL:-buyer1@example.com}"
PASSWORD="${PASSWORD:-password123}"

command -v curl >/dev/null 2>&1 || { echo "curl is required" >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "jq is required for JSON parsing" >&2; exit 1; }

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

echo "Signing in as $EMAIL against Firebase REST..."
RESP=$(curl -s -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"returnSecureToken\":true}")

if [ -z "$RESP" ]; then
  echo "Empty response from Firebase REST" >&2
  exit 1
fi

# Show response for visibility
echo "Firebase sign-in response:" 
echo "$RESP" | jq '.'

ID_TOKEN=$(echo "$RESP" | jq -r .idToken)
if [ -z "$ID_TOKEN" ] || [ "$ID_TOKEN" = "null" ]; then
  echo "Failed to obtain idToken. Aborting." >&2
  exit 1
fi

echo "Got idToken (truncated): ${ID_TOKEN:0:40}..."

# POST idToken to local session endpoint and capture headers/body
PAYLOAD_FILE="$TMPDIR/payload.json"
HEADERS_FILE="$TMPDIR/headers.txt"
BODY_FILE="$TMPDIR/body.txt"

printf '%s' "{\"idToken\":\"$ID_TOKEN\"}" > "$PAYLOAD_FILE"

echo "Exchanging idToken for session cookie at $HOST/api/auth/session ..."
curl -s -D "$HEADERS_FILE" -o "$BODY_FILE" -X POST "$HOST/api/auth/session" \
  -H "Content-Type: application/json" \
  --data-binary @"$PAYLOAD_FILE" || true

echo "Response body:" && cat "$BODY_FILE" | jq . || cat "$BODY_FILE"

SETCOOKIE=$(grep -i '^set-cookie:' "$HEADERS_FILE" | sed -E 's/^[sS]et-[cC]ookie:[ ]*(__session=[^;]+).*$/\1/') || true
if [ -z "$SETCOOKIE" ]; then
  echo "No Set-Cookie header found. Check $HEADERS_FILE" >&2
  echo "Headers:" && sed -n '1,200p' "$HEADERS_FILE"
  exit 1
fi

echo "Captured cookie: $SETCOOKIE"

echo "Verifying session with cookie..."
curl -s -X GET "$HOST/api/auth/session" -H "Cookie: $SETCOOKIE" | jq .

echo "Done."