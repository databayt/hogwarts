#!/usr/bin/env bash
# Print every rotated production value stored in the macOS Keychain as
# `cf-hogwarts-<VAR>` entries, one NAME=value line each, for APPENDING to the
# pulled production dotenv before a Cloudflare build:
#
#   scripts/cf-keychain-env.sh >> "$ENV_FILE"
#
# cf/env-split.mjs keeps the LAST occurrence of a name, so a Keychain value
# overrides whatever Vercel still holds. Store a value with:
#   security add-generic-password -a "$USER" -s "cf-hogwarts-<VAR>" -w "<value>" -U
# Never run this without a redirect — it prints secrets.
set -euo pipefail
security dump-keychain 2>/dev/null \
  | grep -o '"svce"<blob>="cf-hogwarts-[A-Z0-9_]*"' | sed 's/.*="cf-hogwarts-//; s/"$//' | sort -u \
  | while read -r name; do
      printf '%s=%s\n' "$name" "$(security find-generic-password -a "$USER" -s "cf-hogwarts-$name" -w)"
    done
