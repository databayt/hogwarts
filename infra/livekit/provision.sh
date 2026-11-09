#!/usr/bin/env bash
# Provision the self-hosted LiveKit server on Hetzner Cloud and point DNS at it.
# Idempotent: reuses the SSH key, firewall and server it finds by name.
#
#   infra/livekit/provision.sh            # create or reuse, then wait for https://live.balqalam.com
#   infra/livekit/provision.sh --plan     # print the type/location/price it would pick, create nothing
#
# Keychain: hetzner-cloud-token (project API token, read & write) ·
#   livekit-selfhost-LIVEKIT_API_KEY / _API_SECRET · cloudflare-balqalam (DNS edit on balqalam.com)
# SSH key: ~/.ssh/hetzner_livekit(.pub)   — `ssh -i ~/.ssh/hetzner_livekit root@live.balqalam.com`
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd)
NAME=${LK_SERVER_NAME:-livekit-1}
DOMAIN=${LK_DOMAIN:-live.balqalam.com}
TURN=${LK_TURN_DOMAIN:-turn.balqalam.com}
WEBHOOK=${LK_WEBHOOK:-https://balqalam.com/api/webhooks/livekit}
LOCATIONS=${LK_LOCATIONS:-"fsn1 nbg1 hel1"}   # Falkenstein first: lowest RTT to Egypt/Saudi/Gulf of the three
TYPES=${LK_TYPES:-"cax21 cx33 cpx32"}         # 4 vCPU / 8 GB, cheapest first (ARM, then shared x86)
ZONE=${CF_ZONE_ID:-cdeddad4c7e195d637dbbcf33000b78d}
PLAN_ONLY=false; [[ "${1:-}" == "--plan" ]] && PLAN_ONLY=true

H=https://api.hetzner.cloud/v1
HT=$(security find-generic-password -s hetzner-cloud-token -w)
hz() { curl -fsS -H "Authorization: Bearer $HT" -H "Content-Type: application/json" "$@"; }
py() { python3 -c "$1"; }

# ── choose a server type + location that is orderable now ──────────────────
read -r TYPE LOC PRICE < <(hz "$H/server_types?per_page=50" | TYPES="$TYPES" LOCS="$LOCATIONS" python3 -c '
import json, os, sys, urllib.request
types = json.load(sys.stdin)["server_types"]
want_t, want_l = os.environ["TYPES"].split(), os.environ["LOCS"].split()
for tn in want_t:
    t = next((x for x in types if x["name"] == tn and not x.get("deprecation")), None)
    if not t: continue
    for ln in want_l:
        p = next((p for p in t["prices"] if p["location"] == ln), None)
        if p:
            print(tn, ln, p["price_monthly"]["gross"]); sys.exit(0)
sys.exit("no orderable server type among: " + os.environ["TYPES"])
')
echo "==> server type $TYPE in $LOC — €$(printf %.2f "$PRICE")/month gross (plus primary IPv4)"
$PLAN_ONLY && exit 0

# ── SSH key ──────────────────────────────────────────────────────────────────
PUB=$(cat ~/.ssh/hetzner_livekit.pub)
KEY_ID=$(hz "$H/ssh_keys?name=livekit-balqalam" | py 'import json,sys; k=json.load(sys.stdin)["ssh_keys"]; print(k[0]["id"] if k else "")')
if [[ -z "$KEY_ID" ]]; then
  KEY_ID=$(hz -X POST "$H/ssh_keys" --data "$(PUB="$PUB" py 'import json,os; print(json.dumps({"name":"livekit-balqalam","public_key":os.environ["PUB"]}))')" | py 'import json,sys; print(json.load(sys.stdin)["ssh_key"]["id"])')
fi
echo "==> ssh key $KEY_ID"

# ── firewall: the LiveKit port list (docs.livekit.io/transport/self-hosting/vm) + SSH ─
FW_ID=$(hz "$H/firewalls?name=livekit" | py 'import json,sys; f=json.load(sys.stdin)["firewalls"]; print(f[0]["id"] if f else "")')
if [[ -z "$FW_ID" ]]; then
  FW_ID=$(hz -X POST "$H/firewalls" --data "$(py '
import json
anyw = ["0.0.0.0/0", "::/0"]
r = lambda proto, port: {"direction": "in", "protocol": proto, "port": port, "source_ips": anyw}
rules = [r("tcp","22"), r("tcp","80"), r("tcp","443"), r("tcp","7881"),
         r("udp","3478"), r("udp","443"), r("udp","50000-60000"),
         {"direction": "in", "protocol": "icmp", "source_ips": anyw}]
print(json.dumps({"name": "livekit", "rules": rules}))')" | py 'import json,sys; print(json.load(sys.stdin)["firewall"]["id"])')
fi
echo "==> firewall $FW_ID"

# ── server ───────────────────────────────────────────────────────────────────
SRV=$(hz "$H/servers?name=$NAME" | py 'import json,sys; s=json.load(sys.stdin)["servers"]; print(s[0]["id"] if s else "")')
if [[ -z "$SRV" ]]; then
  UD=$(mktemp -t lk-userdata.XXXXXX); trap 'rm -f "$UD"' EXIT; chmod 600 "$UD"
  LK_API_KEY=$(security find-generic-password -s livekit-selfhost-LIVEKIT_API_KEY -w) \
  LK_API_SECRET=$(security find-generic-password -s livekit-selfhost-LIVEKIT_API_SECRET -w) \
    python3 "$HERE/render-cloud-init.py" --domain "$DOMAIN" --turn-domain "$TURN" --webhook "$WEBHOOK" > "$UD"
  SRV=$(hz -X POST "$H/servers" --data "$(UD="$UD" NAME="$NAME" TYPE="$TYPE" LOC="$LOC" KEY="$KEY_ID" FW="$FW_ID" py '
import json, os
print(json.dumps({
  "name": os.environ["NAME"], "server_type": os.environ["TYPE"], "location": os.environ["LOC"],
  "image": "ubuntu-24.04", "ssh_keys": [int(os.environ["KEY"])],
  "firewalls": [{"firewall": int(os.environ["FW"])}],
  "user_data": open(os.environ["UD"]).read(),
  "labels": {"app": "livekit", "owner": "hogwarts"},
  "public_net": {"enable_ipv4": True, "enable_ipv6": True}}))')" | py 'import json,sys; print(json.load(sys.stdin)["server"]["id"])')
  echo "==> created server $SRV"
else
  echo "==> reusing server $SRV"
fi
for _ in $(seq 1 60); do
  read -r STATUS IP < <(hz "$H/servers/$SRV" | py 'import json,sys; s=json.load(sys.stdin)["server"]; print(s["status"], s["public_net"]["ipv4"]["ip"])')
  [[ "$STATUS" == running ]] && break; sleep 5
done
echo "==> $NAME is $STATUS at $IP"

# ── DNS: grey-cloud A records (WebRTC/TURN cannot pass Cloudflare's proxy) ───
CFT=$(security find-generic-password -s cloudflare-balqalam -w)
cf() { curl -fsS -H "Authorization: Bearer $CFT" -H "Content-Type: application/json" "$@"; }
CFA=https://api.cloudflare.com/client/v4/zones/$ZONE/dns_records
for host in "$DOMAIN" "$TURN"; do
  RID=$(cf "$CFA?type=A&name=$host" | py 'import json,sys; r=json.load(sys.stdin)["result"]; print(r[0]["id"] if r else "")')
  BODY=$(HOST="$host" IP="$IP" py 'import json,os; print(json.dumps({"type":"A","name":os.environ["HOST"],"content":os.environ["IP"],"proxied":False,"ttl":300}))')
  if [[ -n "$RID" ]]; then cf -X PUT "$CFA/$RID" --data "$BODY" >/dev/null; else cf -X POST "$CFA" --data "$BODY" >/dev/null; fi
  echo "==> DNS $host → $IP (DNS only)"
done

# ── wait for cloud-init + Caddy's certificate: LiveKit answers "OK" on / ────
echo "==> waiting for https://$DOMAIN (install + certificate, usually 3–8 min)"
for _ in $(seq 1 80); do
  if [[ "$(curl -s --max-time 5 "https://$DOMAIN" || true)" == "OK" ]]; then echo "==> https://$DOMAIN is up"; exit 0; fi
  sleep 10
done
echo "!! not up yet — ssh -i ~/.ssh/hetzner_livekit root@$IP 'cloud-init status; journalctl -u livekit-docker -n 50'"; exit 1
