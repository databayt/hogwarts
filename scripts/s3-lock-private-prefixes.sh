#!/usr/bin/env bash
# Copyright (c) 2025-present databayt
# Licensed under SSPL-1.0 -- see LICENSE for details
#
# Close anonymous public read on the upload bucket's private prefixes.
#
# WHY -------------------------------------------------------------------
# `hogwarts-databayt` carries a blanket `PublicReadGetObject` statement:
#
#     Effect: Allow · Principal: "*" · s3:GetObject · arn:...:hogwarts-databayt/*
#
# Every object in it is therefore world-readable to anyone holding the URL,
# with no session, no expiry, and no way to revoke short of deleting the file.
# That covers ~2.6 GB of school lesson video under `stream/`, private message
# attachments under `messaging/`, and payment receipts under `payment-proof/`.
#
# This script layers an explicit Deny over those prefixes. An explicit Deny
# always beats an Allow in IAM, so the blanket statement keeps serving the
# genuinely-public assets (catalog art, icons, school logos, marketing media)
# untouched, and only the named prefixes stop being anonymously readable.
#
# Our own signed requests keep working: the Deny is conditioned on the caller
# NOT being this AWS account. A presigned URL is signed with our credentials,
# so `aws:PrincipalAccount` resolves to us and the Deny does not apply. An
# anonymous request has no such key, the StringNotEquals matches, and it is
# denied.
#
# ORDER -----------------------------------------------------------------
# Deploy the application first. The app must already be minting signed URLs
# (`/api/lumos/video/[videoId]`, `/api/lumos/file/[kind]/[id]`) for the
# prefixes being locked, or their content 403s the moment this runs.
#
#   stream/         → SAFE once the Lumos protection lane is deployed.
#   messaging/      → NOT yet safe. Message attachments still render from
#                     their raw URL; locking this breaks them until the
#                     messaging block gets the same treatment.
#   payment-proof/  → NOT yet safe, same reason.
#
# So the default here locks `stream/` only. Add the others once their read
# paths sign too — the list is one array below.
#
# USAGE -----------------------------------------------------------------
#   bash scripts/s3-lock-private-prefixes.sh            # show the diff, change nothing
#   bash scripts/s3-lock-private-prefixes.sh --apply    # write the policy
#   bash scripts/s3-lock-private-prefixes.sh --verify   # prove the lock works
#   bash scripts/s3-lock-private-prefixes.sh --rollback # restore the backup
#
# Every --apply writes a timestamped backup of the current policy next to
# this script's working directory before touching anything.

set -euo pipefail

BUCKET="${AWS_S3_BUCKET:-hogwarts-databayt}"
ACCOUNT="${AWS_ACCOUNT_ID:-446731258367}"
BACKUP_DIR="${TMPDIR:-/tmp}/s3-policy-backups"

# Prefixes to deny anonymous read on. Add to this list only after the code
# that serves them mints signed URLs.
PRIVATE_PREFIXES=(
  "stream"
  # "messaging"      # unlock-blocked: messaging block still serves raw URLs
  # "payment-proof"  # unlock-blocked: finance block still serves raw URLs
)

SID="DenyAnonymousReadOfPrivatePrefixes"

resource_json() {
  local out=""
  for p in "${PRIVATE_PREFIXES[@]}"; do
    out+="\"arn:aws:s3:::${BUCKET}/${p}/*\","
  done
  echo "[${out%,}]"
}

deny_statement() {
  cat <<EOF
{
  "Sid": "${SID}",
  "Effect": "Deny",
  "Principal": "*",
  "Action": "s3:GetObject",
  "Resource": $(resource_json),
  "Condition": {
    "StringNotEquals": { "aws:PrincipalAccount": "${ACCOUNT}" }
  }
}
EOF
}

current_policy() {
  aws s3api get-bucket-policy --bucket "$BUCKET" --query Policy --output text
}

# Drop any previous copy of our statement, then append the current one, so the
# script is idempotent and re-running it never stacks duplicates.
next_policy() {
  local cur deny
  cur="$(current_policy)"
  deny="$(deny_statement)"
  python3 - "$cur" "$deny" <<'PY'
import json, sys
policy = json.loads(sys.argv[1])
deny = json.loads(sys.argv[2])
policy["Statement"] = [
    s for s in policy["Statement"] if s.get("Sid") != deny["Sid"]
]
policy["Statement"].append(deny)
print(json.dumps(policy, indent=2))
PY
}

case "${1:---dry-run}" in
  --apply)
    mkdir -p "$BACKUP_DIR"
    stamp="$(date -u +%Y%m%dT%H%M%SZ)"
    backup="${BACKUP_DIR}/${BUCKET}-${stamp}.json"
    current_policy > "$backup"
    echo "Backed up current policy → $backup"

    next_policy > "${BACKUP_DIR}/${BUCKET}-next.json"
    aws s3api put-bucket-policy \
      --bucket "$BUCKET" \
      --policy "file://${BACKUP_DIR}/${BUCKET}-next.json"
    echo "Applied. Now run: bash $0 --verify"
    ;;

  --verify)
    fail=0
    for p in "${PRIVATE_PREFIXES[@]}"; do
      key="$(aws s3api list-objects-v2 --bucket "$BUCKET" --prefix "${p}/" \
              --max-keys 1 --query 'Contents[0].Key' --output text)"
      [ "$key" = "None" ] && { echo "SKIP ${p}/ — no objects"; continue; }

      anon="$(curl -s -o /dev/null -w '%{http_code}' \
              "https://${BUCKET}.s3.${AWS_REGION:-us-east-1}.amazonaws.com/${key}")"
      signed_url="$(aws s3 presign "s3://${BUCKET}/${key}" --expires-in 60)"
      signed="$(curl -s -o /dev/null -w '%{http_code}' -r 0-1023 "$signed_url")"

      # Anonymous must be refused; a signed read must still succeed.
      if [ "$anon" = "403" ] && { [ "$signed" = "200" ] || [ "$signed" = "206" ]; }; then
        echo "PASS ${p}/ — anonymous ${anon}, signed ${signed}"
      else
        echo "FAIL ${p}/ — anonymous ${anon} (want 403), signed ${signed} (want 200/206)"
        fail=1
      fi
    done
    exit $fail
    ;;

  --rollback)
    latest="$(ls -1t "${BACKUP_DIR}/${BUCKET}"-*.json 2>/dev/null | grep -v -- '-next.json' | head -1)"
    [ -z "$latest" ] && { echo "No backup found in $BACKUP_DIR"; exit 1; }
    aws s3api put-bucket-policy --bucket "$BUCKET" --policy "file://${latest}"
    echo "Restored $latest"
    ;;

  *)
    echo "=== Bucket: ${BUCKET} (account ${ACCOUNT}) ==="
    echo "=== Prefixes to deny anonymous read: ${PRIVATE_PREFIXES[*]} ==="
    echo
    echo "--- CURRENT ---"
    current_policy | python3 -m json.tool
    echo
    echo "--- PROPOSED ---"
    next_policy
    echo
    echo "Nothing changed. Re-run with --apply to write it."
    ;;
esac
