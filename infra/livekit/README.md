# Self-hosted LiveKit (Hetzner Cloud)

Our own LiveKit server for live classes. Decision: kun `D-20261109-livekit-hetzner-final`, tracked on hogwarts#470.

## What runs where

| Part      | Detail                                                                                                                                                                                                        |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Server    | One Hetzner Cloud VM, `livekit-1`. Falkenstein first, ARM `cax21` first: 4 vCPU / 8 GB, 20 TB traffic included, about €9–15/mo.                                                                               |
| Software  | `docker-compose.yaml`: Caddy (layer-4 build) on :443, livekit-server, Redis. Versions pinned. Installed by cloud-init into `/opt/livekit`, run by the `livekit-docker` systemd unit.                          |
| Names     | `live.balqalam.com` (signal, `wss://`) and `turn.balqalam.com` (TURN/TLS on 443). Both are grey-cloud (DNS-only) A records in the balqalam.com Cloudflare zone, because WebRTC and TURN can't pass the proxy. |
| Ports     | TCP 22, 80, 443, 7881 · UDP 443, 3478, 50000–60000 (Hetzner firewall `livekit`)                                                                                                                               |
| Webhook   | `https://balqalam.com/api/webhooks/livekit`, signed with this server's key                                                                                                                                    |
| Recording | None. There's no egress service here; `switch.sh selfhost` empties `LIVEKIT_RECORDING_BUCKET`, so the UI shows recording as unavailable.                                                                      |
| Fallback  | LiveKit Cloud project `hogwarts-jsmb894l`. Its values are in Keychain `livekit-cloud-*`.                                                                                                                      |

These files follow LiveKit's generator (github.com/livekit/deploy, `generate/`) with two changes:

1. docker-compose is downloaded as `docker-compose-linux-<arch>`. The template's `$(uname -s)` gives `Linux`, and that download 404s.
2. The webhook is added.

## Keychain

- `hetzner-cloud-token`: Hetzner project API token, read & write.
- `livekit-selfhost-LIVEKIT_API_KEY` / `_API_SECRET`: this server's keys.
- `livekit-cloud-LIVEKIT_{HOST,WS_URL,API_KEY,API_SECRET}`: the Cloud fallback.
- `cloudflare-balqalam`: DNS edit on balqalam.com.

SSH: `ssh -i ~/.ssh/hetzner_livekit root@live.balqalam.com`.

## Bring it up

```bash
infra/livekit/provision.sh --plan   # what it would order, and the monthly price
infra/livekit/provision.sh          # key, firewall, server, DNS, then waits for "OK" on https://live.balqalam.com
```

Before any class uses it:

- Load test with `lk load-test` from a second short-lived box (not the Mac's home link). For example, 10 rooms × 6 participants with one video publisher each. Watch CPU and bandwidth with `htop` / `nload`.
- Latency check from the Egypt, Saudi and Gulf Globalping probes.

## Switch production

Switch only when no class is live, at night (Khartoum).

```bash
infra/livekit/switch.sh selfhost    # Worker secrets → our server, then restart the container
infra/livekit/switch.sh cloud       # back to LiveKit Cloud: about 5 minutes, same restart
```

After a switch:

1. Wait for `/api/health` uptime to reset.
2. Run the demo three-browser test (teacher, student at 360px, guardian), all starting from `/ar/timetable`.
3. Check that `live_class_participants` and webhook rows land.

## Operate

- **Upgrade:** edit the image tags in `/opt/livekit/docker-compose.yaml` on the server (and here), then `systemctl restart livekit-docker`. Don't do it during class hours.
- **Health:** `curl https://live.balqalam.com` returns `OK`. Logs: `journalctl -u livekit-docker -f`.
- **If the server is down during class:** run `switch.sh cloud`. That falls back to LiveKit Cloud's free plan, 5,000 participant-minutes a month.
