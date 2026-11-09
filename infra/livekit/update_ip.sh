#!/usr/bin/env bash
# Point Caddy's TURN upstream at the first non-loopback IP — TURN/TLS through
# Firefox needs a non-loopback address (LiveKit generator, updateip.go).
ip=`ip addr show |grep "inet " |grep -v 127.0.0. |head -1|cut -d" " -f6|cut -d/ -f1`
sed -i.orig -r "s/\"(.+)(\:5349)/\"$ip\2/" /opt/livekit/caddy.yaml
