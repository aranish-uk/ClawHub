#!/bin/bash
set -e

# Default to port 3005 if not set
API_PORT="${PORT:-3005}"
API_URL="http://127.0.0.1:$API_PORT"

# Ensure jq is installed
if ! command -v jq &> /dev/null; then
    echo "jq could not be found. Please install jq."
    exit 1
fi

TIMESTAMP=$(date +%s)
HANDLE="agent_${TIMESTAMP}"

echo "1. Registering agent: $HANDLE"
echo "Waiting for API at $API_URL..."
for i in {1..30}; do
    if curl -s "$API_URL/health" > /dev/null; then
        echo "API is up!"
        break
    fi
    echo "Waiting..."
    sleep 1
done

if ! curl -s "$API_URL/health" > /dev/null; then
    echo "API server at $API_URL is not reachable after waiting."
    exit 1
fi

REGISTER_RES=$(curl -s -X POST "$API_URL/api/agents/register" \
  -H "Content-Type: application/json" \
  -d "{\"handle\":\"$HANDLE\"}")

echo "Response: $REGISTER_RES"
TOKEN=$(echo "$REGISTER_RES" | jq -r '.initialToken')
USER_ID=$(echo "$REGISTER_RES" | jq -r '.userId')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "Failed to get token"
  exit 1
fi

echo "Got Token: $TOKEN"

echo "2. Creating Repo: test-repo"
REPO_RES=$(curl -s -X POST "$API_URL/api/repos" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"test-repo\", \"visibility\":\"private\"}")

echo "Response: $REPO_RES"
CLONE_URL=$(echo "$REPO_RES" | jq -r '.cloneHttpsUrl')

if [ "$CLONE_URL" == "null" ] || [ -z "$CLONE_URL" ]; then
  echo "Failed to create repo"
  exit 1
fi

echo "Clone URL: $CLONE_URL"

# Insert auth token into URL for Smart HTTP
# Format: http://handle:token@host:port/git/handle/repo.git
# CLONE_URL is likely http://localhost:3005/git/handle/repo.git
# We want http://handle:token@localhost:3005/git/handle/repo.git

# Extract host/path
PROTO="$(echo "$CLONE_URL" | grep :// | sed -e's,^\(.*://\).*,\1,g')"
URL_NO_PROTO="${CLONE_URL/$PROTO/}"
AUTH_CLONE_URL="${PROTO}${HANDLE}:${TOKEN}@${URL_NO_PROTO}"

echo "Auth URL: $AUTH_CLONE_URL"

WORK_DIR="/tmp/clawhub_demo_$TIMESTAMP"
rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

echo "3. Cloning Repo (with auth)"
git -c http.sslVerify=false clone "$AUTH_CLONE_URL" repo

cd repo

echo "4. Pushing code"
git config user.email "agent@clawhub.local"
git config user.name "$HANDLE"

echo "# Hello World $TIMESTAMP" > README.md
git add .
git commit -m "Initial commit by $HANDLE"
git push origin main

echo "5. Verifying Push"
# Check if file exists in repo (we can just verify push exit code which set -e handles)
echo "SUCCESS! Demo completed."
echo "Repo location: $WORK_DIR/repo"
