# hogwarts on Cloudflare Containers — image over a prebuilt Next standalone
# output. The Next build itself happens on the Mac (scripts/deploy-cloudflare.sh);
# the only thing compiled here is the Evolution stage, which has to be built for
# the image's own platform.

# ---- Evolution API: the WhatsApp bridge, as a second process in this one
# paid container ($0 extra — a second container is billed on provisioned
# memory). Same base as the runtime so its Prisma engine and sharp binaries
# match. cf/entry.cjs supervises it on 127.0.0.1:8080; nothing exposes it.
# The layer is rebuilt only when EVOLUTION_VERSION changes.
FROM node:22-bookworm-slim AS evolution
ARG EVOLUTION_VERSION=2.3.7
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /evolution
RUN curl -fsSL "https://github.com/EvolutionAPI/evolution-api/archive/refs/tags/${EVOLUTION_VERSION}.tar.gz" | tar -xz --strip-components=1
RUN npm ci --no-audit --no-fund --loglevel=error
# .env.example seeds the defaults Evolution's own scripts read at build time;
# every real value is passed as process env by cf/entry.cjs and wins over it.
ENV DATABASE_PROVIDER=postgresql DOCKER_ENV=true
RUN cp .env.example .env && npm run db:generate --silent && npx tsup

# ---- Runtime
FROM node:22-bookworm-slim
# Prisma detects the OpenSSL version by running `openssl`; slim images lack it and
# Prisma then guesses debian-openssl-1.1.x and finds no engine. (rosetta handles
# the amd64 emulation on the Mac.)
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
# Next's heap cap leaves room for the bridge (768 MiB, set in cf/entry.cjs)
# inside the 4 GiB standard-1 instance.
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NODE_OPTIONS=--max-old-space-size=2048 NEXT_TELEMETRY_DISABLED=1
COPY --from=evolution /evolution /evolution
WORKDIR /app
COPY .next/standalone ./
COPY .next/static ./.next/static
COPY public ./public
COPY cf/entry.cjs ./entry.cjs
EXPOSE 3000
CMD ["node", "entry.cjs"]
