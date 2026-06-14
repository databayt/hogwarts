# Deploy — Realtime (Socket.IO) + WhatsApp (Evolution API) on Oracle Cloud

Single Oracle Cloud **Always-Free** ARM VM running four containers behind Nginx:

```
                         Vercel (Next.js app — ed.databayt.org, *.databayt.org)
                              │  POST /api/emit*  │  Evolution REST  │  ← /api/webhooks/whatsapp
                              ▼                   ▼                   │
        ┌─────────────────────────────────────────────────────────────────────┐
        │  Oracle VM (Jeddah, VM.Standard.A1.Flex)  — Nginx :443 TLS (Certbot)  │
        │     socket.databayt.org → 127.0.0.1:3000  (hogwarts-socket)           │
        │     evolution.databayt.org → 127.0.0.1:8080  (Evolution API v2)       │
        │     postgres :5432  ·  redis :6379   (internal only)                  │
        └─────────────────────────────────────────────────────────────────────┘
```

This is the live blocker for the **messaging** block (see `../src/components/school-dashboard/messaging/ISSUE.md` → "WhatsApp Activation Balance"). Supersedes the now-closed issue #262 — this file is the current runbook (port 3000, Evolution v2, `.env`-based secrets).

**Legend:** 👤 = you (Oracle/DNS/Vercel consoles, phone) · 🤖 = Claude can run over SSH once you share access.

---

## Status checkpoint

- [x] Phase 1.1 — Oracle Cloud account created
- [ ] Phase 1.2 — Create the VM 👤
- [ ] Phase 1.3 — Capture public IP + SSH key 👤
- [ ] Phase 2 — DNS A records 👤
- [ ] Phase 3 — Oracle Security List (firewall) 👤
- [ ] Phase 4 — VM bootstrap 🤖
- [ ] Phase 5 — Deploy the stack 🤖
- [ ] Phase 6 — Nginx + Let's Encrypt 🤖
- [ ] Phase 7 — Vercel env vars 👤
- [ ] Phase 8 — End-to-end verification 👤🤖
- [ ] Phase 9 — Decommission Railway 👤

**Secrets are already generated** (URL-safe hex) and live in `./.env` (gitignored). The same four app-facing values go on Vercel in Phase 7. Do **not** regenerate them.

---

## Phase 1.2 — Create the VM 👤 (~10 min)

Oracle Console → hamburger → **Compute → Instances → Create instance**

| Field          | Value                                                             |
| -------------- | ----------------------------------------------------------------- |
| Name           | `hogwarts-whatsapp`                                               |
| Image          | **Ubuntu 22.04** (Canonical)                                      |
| Shape series   | **Ampere** (ARM)                                                  |
| Shape          | `VM.Standard.A1.Flex`                                             |
| OCPUs / Memory | **2 OCPU / 12 GB** (fall back to 1/6 if capacity-limited)         |
| Networking     | Default VCN + public subnet, **assign public IPv4**               |
| SSH keys       | **Generate a key pair for me** → download the private `.key` file |
| Boot volume    | 46.6 GB default                                                   |

> **"Out of host capacity"?** Retry in 1–2 h, or drop to 1 OCPU / 6 GB, or last-resort 2× `VM.Standard.E2.1.Micro` (AMD).

## Phase 1.3 — Capture outputs 👤

Once state = **Running**, note:

- Public IPv4: `___.___.___.___`
- Local path to the downloaded private key, then lock it down: `chmod 600 ~/Downloads/hogwarts-whatsapp.key`
- Confirm SSH works: `ssh -i <key> ubuntu@<IP> "echo ok"`

**→ Hand me the IP + key path and I take over from Phase 4.**

---

## Phase 2 — DNS A records 👤 (~5 min)

Where `databayt.org` DNS is managed (registrar / Vercel DNS), add:

| Type | Host        | Value     | TTL |
| ---- | ----------- | --------- | --- |
| A    | `evolution` | `<VM_IP>` | 300 |
| A    | `socket`    | `<VM_IP>` | 300 |

Verify before Phase 6: `dig +short evolution.databayt.org` and `dig +short socket.databayt.org` both return the VM IP (propagation 5–15 min).

## Phase 3 — Oracle Security List (firewall) 👤 (~5 min)

Networking → **Virtual Cloud Networks** → your VCN → **Security Lists** → default → **Add Ingress Rules** (Source `0.0.0.0/0`, TCP):

| Port | Why                             |
| ---- | ------------------------------- |
| 22   | SSH                             |
| 80   | Let's Encrypt HTTP-01 challenge |
| 443  | HTTPS                           |

Do **NOT** open 3000 / 8080 / 5432 / 6379 — they stay bound to `127.0.0.1` and are reached only through Nginx.

---

## Phase 4 — VM bootstrap 🤖 (~10 min, over SSH)

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-v2 nginx certbot python3-certbot-nginx fail2ban ufw
sudo usermod -aG docker ubuntu
sudo systemctl enable --now docker nginx fail2ban

# Host firewall (belt-and-braces with the Oracle Security List)
sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
sudo ufw --force enable

# Key-only SSH
sudo sed -i 's/#\?PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart ssh
```

> Oracle's Ubuntu images add a restrictive `iptables` REJECT rule on the INPUT chain. If 80/443 are unreachable even after the Security List + ufw, flush the legacy reject:
> `sudo netfilter-persistent flush` _(or)_ edit `/etc/iptables/rules.v4` to drop the `-A INPUT -j REJECT` lines, then `sudo netfilter-persistent save`.

## Phase 5 — Deploy the stack 🤖 (~10 min)

Copy this `socket-server/` directory (with its `.env`) to the VM:

```bash
# from the local repo root
scp -i <key> -r socket-server ubuntu@<VM_IP>:/tmp/socket-server
ssh -i <key> ubuntu@<VM_IP> 'sudo mkdir -p /opt/hogwarts && sudo mv /tmp/socket-server /opt/hogwarts/ && sudo chown -R ubuntu:ubuntu /opt/hogwarts'
```

`node_modules/` and `dist/` are not needed on the VM (the image builds from source); `.dockerignore` excludes them. Then:

```bash
cd /opt/hogwarts/socket-server
test -f .env && grep -q SOCKET_SECRET .env && echo ".env present ✓"
docker compose up -d --build
docker compose ps          # all four → healthy / running
docker compose logs -f --tail=50
```

Internal smoke (from the VM):

```bash
curl -s localhost:3000/api/status            # {"status":"ok",...}
curl -s localhost:8080 -H "apikey: $(grep EVOLUTION_API_KEY .env|cut -d= -f2)" | head
```

## Phase 6 — Nginx reverse proxy + TLS 🤖 (~10 min)

```bash
sudo tee /etc/nginx/sites-available/socket >/dev/null <<'EOF'
server {
  listen 80;
  server_name socket.databayt.org;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 3600s;
    proxy_send_timeout 3600s;
  }
}
EOF

sudo tee /etc/nginx/sites-available/evolution >/dev/null <<'EOF'
server {
  listen 80;
  server_name evolution.databayt.org;
  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 32M;
    proxy_read_timeout 120s;
  }
}
EOF

sudo ln -sf /etc/nginx/sites-available/socket    /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/evolution /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Issue certs (DNS from Phase 2 must resolve to this VM first)
sudo certbot --nginx -d socket.databayt.org -d evolution.databayt.org \
  --non-interactive --agree-tos -m osmanabdout@hotmail.com --redirect
sudo systemctl status certbot.timer   # auto-renew
```

---

## Phase 7 — Vercel env vars 👤 (~5 min)

Set on **Production** (values are in `./.env` — they must match exactly):

| Variable                  | Value                                                                       |
| ------------------------- | --------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SOCKET_URL`  | `https://socket.databayt.org`                                               |
| `EVOLUTION_API_URL`       | `https://evolution.databayt.org`                                            |
| `EVOLUTION_API_KEY`       | = `EVOLUTION_API_KEY` from `.env`                                           |
| `SOCKET_SECRET`           | = `SOCKET_SECRET` from `.env`                                               |
| `EMIT_SECRET`             | = `EMIT_SECRET` from `.env`                                                 |
| `WHATSAPP_WEBHOOK_SECRET` | = `WHATSAPP_WEBHOOK_SECRET` from `.env`                                     |
| `CRON_SECRET`             | confirm set + non-empty (the `*/5` WhatsApp cron refuses to run without it) |

Then redeploy so the new env takes effect: `vercel --prod` (or push to `main`).

> CLI alternative: `vercel env add NEXT_PUBLIC_SOCKET_URL production` (repeat per var).

---

## Phase 8 — Verify 👤🤖 (~15 min)

```bash
curl -sI https://socket.databayt.org/api/status        # 200, valid TLS
curl -s  https://evolution.databayt.org | head -1      # reachable
```

1. **QR (👤):** app → Settings → WhatsApp → **Connect** → QR renders → scan from phone → status `connected`. Confirm the session survives a restart: `docker compose restart evolution-api` → still `connected` (auth persists in the `evolution_instances` volume).
2. **Outbound (👤):** `/messages` → message a guardian/teacher with a WhatsApp phone → arrives on their phone.
3. **Inbound (👤):** reply from the phone → appears in the app (webhook → socket push).
4. **Realtime (👤):** two tabs as different users → message appears live, presence dot turns green, typing dots relay.

## Phase 9 — Decommission Railway 👤

After ~24 h of confirmed Oracle uptime: delete the Railway `hogwarts` project and remove its payment method.

---

## Operations

| Task                | Command (on the VM, `cd /opt/hogwarts/socket-server`)                                      |
| ------------------- | ------------------------------------------------------------------------------------------ |
| Status / health     | `docker compose ps` · `curl -s localhost:3000/api/status`                                  |
| Logs                | `docker compose logs -f --tail=100 socket-server`                                          |
| Update socket code  | re-`scp` the dir, then `docker compose up -d --build socket-server`                        |
| Restart one service | `docker compose restart evolution-api`                                                     |
| Rotate a secret     | edit `.env` → `docker compose up -d` → update the matching Vercel var → `vercel --prod`    |
| Keep VM warm        | active traffic suffices; else a cron self-ping of `/api/status` guards Oracle idle-reclaim |

**Gotchas**

- Secrets are **hex, not base64** — the webhook secret rides in a URL query (`?secret=`) where base64 `+` decodes to a space and breaks the compare. `.env` is hex; keep it that way.
- The socket server's CORS accepts the `CLIENT_URL` allowlist **plus any `*.databayt.org`** origin in production (multi-tenant: every school is its own subdomain). Adding a school subdomain needs no socket redeploy.
- Evolution **v2 requires Postgres** — don't switch to a v1-style `KEY=`/file-only setup; the app calls v2 endpoints (`integration: WHATSAPP-BAILEYS`, `{number,text}` sendText).
- Don't open 3000/8080/5432/6379 publicly — Nginx is the only public surface.
