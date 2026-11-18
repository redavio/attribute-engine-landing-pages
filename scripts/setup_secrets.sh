#!/usr/bin/env bash
# Optional, run once by hand: PROJECT=my-gcp-project scripts/setup_secrets.sh
# Copies the two API keys from .env into your project's Secret Manager, creates the
# run secret. Anything that calls the server with run tokens reads run-secret from
# Secret Manager (gcloud secrets versions access latest --secret run-secret).
set -euo pipefail
cd "$(dirname "$0")/.."
PROJECT=${PROJECT:?Set PROJECT to your Google Cloud project}
value() { grep -E "^$1=" .env | head -1 | cut -d= -f2- | tr -d '"'; }
RUN_SECRET=$(python3 -c "import secrets; print(secrets.token_hex(32))")
printf %s "$(value OPENROUTER_API_KEY)" | gcloud secrets create openrouter-key --project "$PROJECT" --replication-policy automatic --data-file=-
printf %s "$(value AI_GATEWAY_API_KEY)" | gcloud secrets create gateway-key --project "$PROJECT" --replication-policy automatic --data-file=-
printf %s "$RUN_SECRET" | gcloud secrets create run-secret --project "$PROJECT" --replication-policy automatic --data-file=-
echo "Done. Nothing was printed or committed."
