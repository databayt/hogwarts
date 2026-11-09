#!/usr/bin/env python3
"""Render the LiveKit server's cloud-init user data to stdout.

Mirrors the LiveKit generator's Ubuntu cloud-init (github.com/livekit/deploy,
startup_ubuntu.go), with two changes:
  - docker-compose is fetched as `docker-compose-linux-<arch>`: Docker
    publishes lowercase asset names, and the template's `$(uname -s)` gives
    "Linux", which 404s.
  - the webhook URL is filled in.

Secrets arrive in the environment (LK_API_KEY, LK_API_SECRET), never from git,
and the output is meant for the provider's user-data API — do not commit it.

    LK_API_KEY=… LK_API_SECRET=… python3 render-cloud-init.py \
        --domain live.balqalam.com --turn-domain turn.balqalam.com \
        --webhook https://balqalam.com/api/webhooks/livekit
"""
import argparse
import os
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
COMPOSE_VERSION = "v5.7.0"


def indent(text: str, spaces: int = 6) -> str:
    pad = " " * spaces
    return "\n".join(pad + line if line else "" for line in text.rstrip("\n").split("\n"))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--domain", required=True)
    ap.add_argument("--turn-domain", required=True)
    ap.add_argument("--webhook", required=True)
    a = ap.parse_args()

    key, secret = os.environ.get("LK_API_KEY", ""), os.environ.get("LK_API_SECRET", "")
    if not key or len(secret) < 32:
        print("LK_API_KEY and LK_API_SECRET (32+ chars) are required", file=sys.stderr)
        return 2

    def fill(name: str) -> str:
        s = (HERE / name).read_text()
        for k, v in {
            "__DOMAIN__": a.domain,
            "__TURN_DOMAIN__": a.turn_domain,
            "__WEBHOOK_URL__": a.webhook,
            "__API_KEY__": key,
            "__API_SECRET__": secret,
        }.items():
            s = s.replace(k, v)
        return s

    files = {
        "/opt/livekit/livekit.yaml": fill("livekit.yaml.tmpl"),
        "/opt/livekit/caddy.yaml": fill("caddy.yaml.tmpl"),
        "/opt/livekit/update_ip.sh": (HERE / "update_ip.sh").read_text(),
        "/opt/livekit/docker-compose.yaml": (HERE / "docker-compose.yaml").read_text(),
        "/opt/livekit/redis.conf": (HERE / "redis.conf").read_text(),
        "/etc/systemd/system/livekit-docker.service": (HERE / "livekit-docker.service").read_text(),
    }

    out = [
        "#cloud-config",
        "package_update: true",
        "package_upgrade: all",
        "",
        "packages:",
        "  - docker.io",
        "",
        "bootcmd:",
        "  - mkdir -p /opt/livekit/caddy_data",
        "  - mkdir -p /usr/local/bin",
        "",
        "write_files:",
    ]
    for path, content in files.items():
        out += [f"  - path: {path}", "    content: |", indent(content)]
    out += [
        "",
        "runcmd:",
        f'  - curl -fL "https://github.com/docker/compose/releases/download/{COMPOSE_VERSION}/docker-compose-linux-$(uname -m)" -o /usr/local/bin/docker-compose',
        "  - chmod 755 /usr/local/bin/docker-compose",
        "  - chmod 755 /opt/livekit/update_ip.sh",
        "  - /opt/livekit/update_ip.sh",
        "  - systemctl enable livekit-docker",
        "  - systemctl start livekit-docker",
        "",
    ]
    sys.stdout.write("\n".join(out))
    return 0


if __name__ == "__main__":
    sys.exit(main())
