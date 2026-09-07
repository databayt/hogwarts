# hogwarts on Cloudflare Containers — image over a prebuilt Next standalone
# output. The build itself happens on the Mac (scripts/deploy-cloudflare.sh);
# nothing here compiles.
FROM node:22-bookworm-slim
# Prisma detects the OpenSSL version by running `openssl`; slim images lack it and
# Prisma then guesses debian-openssl-1.1.x and finds no engine. This RUN is the one
# non-COPY step (rosetta handles the amd64 emulation on the Mac).
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NODE_OPTIONS=--max-old-space-size=3072 NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public
COPY cf/entry.cjs ./entry.cjs
EXPOSE 3000
CMD ["node", "entry.cjs"]
