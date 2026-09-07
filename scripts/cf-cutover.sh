#!/usr/bin/env bash
# Staged DNS cutover of balqalam.com to the Cloudflare Worker, one hostname at a
# time, each step reversible. The Worker routes (wrangler.jsonc) capture a request
# only when the hostname's DNS record is PROXIED (orange cloud); grey-clouded
# records keep going to Vercel. Record targets are never changed.
#
#   scripts/cf-cutover.sh list                 show the zone's records (name, type, target, proxied)
#   scripts/cf-cutover.sh on  <hostname>       proxy the record (traffic → Worker → container)
#   scripts/cf-cutover.sh off <hostname>       un-proxy it (traffic → Vercel again)
#   scripts/cf-cutover.sh wildcard             create a proxied `*` CNAME → balqalam.com (new schools)
#
# Needs CLOUDFLARE_API_TOKEN with Zone DNS:Edit on balqalam.com.
set -euo pipefail
ZONE=cdeddad4c7e195d637dbbcf33000b78d   # balqalam.com
API=https://api.cloudflare.com/client/v4
TOK=${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN}
cf() { curl -s -H "Authorization: Bearer $TOK" -H "Content-Type: application/json" "$@"; }
records() { cf "$API/zones/$ZONE/dns_records?per_page=200"; }
MODE=${1:-list}; HOST=${2:-}

case "$MODE" in
  list)
    records | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);if(!j.success){console.error(JSON.stringify(j.errors));process.exit(1)}for(const r of j.result)console.log(r.type.padEnd(6),r.name.padEnd(26),String(r.content).padEnd(40),r.proxied?"PROXIED → Worker":"grey → origin")})' ;;
  on|off)
    [[ -n "$HOST" ]] || { echo "hostname required"; exit 2; }
    WANT=$([[ "$MODE" == on ]] && echo true || echo false)
    ID=$(records | HOST="$HOST" node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);const r=(j.result||[]).find(r=>r.name===process.env.HOST&&(r.type==="A"||r.type==="CNAME"));console.log(r?r.id:"")})')
    [[ -n "$ID" ]] || { echo "no A/CNAME record for $HOST"; exit 1; }
    cf -X PATCH "$API/zones/$ZONE/dns_records/$ID" --data "{\"proxied\":$WANT}" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);console.log(j.success?`${j.result.name}: proxied=${j.result.proxied}`:JSON.stringify(j.errors));process.exit(j.success?0:1)})' ;;
  wildcard)
    cf -X POST "$API/zones/$ZONE/dns_records" --data '{"type":"CNAME","name":"*","content":"balqalam.com","proxied":true,"ttl":1}' | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);console.log(j.success?`*.balqalam.com → ${j.result.content} proxied=${j.result.proxied}`:JSON.stringify(j.errors));process.exit(j.success?0:1)})' ;;
  *) echo "mode: list|on|off|wildcard"; exit 2 ;;
esac
