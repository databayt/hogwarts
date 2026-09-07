# hogwarts on Cloudflare Containers — COPY-only image over a prebuilt Next
# standalone output. The build itself happens on the Mac (scripts/deploy-cloudflare.sh);
# nothing here compiles, so the linux/amd64 image builds on an arm64 host too.
FROM node:22-bookworm-slim
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NODE_OPTIONS=--max-old-space-size=3072 NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public
COPY cf/entry.cjs ./entry.cjs
EXPOSE 3000
CMD ["node", "entry.cjs"]
