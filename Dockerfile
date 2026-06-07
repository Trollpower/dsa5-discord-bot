# ---- Build Stage ----
FROM node:20-bookworm-slim AS build

WORKDIR /app

COPY package*.json ./
# RUN npm ci --omit=dev --only=production && npm cache clean --force
RUN npm ci --only=production && npm cache clean --force

COPY . .

# Verzeichnisse die später als Volumes gemountet werden vorab anlegen
RUN mkdir -p /app/storage /app/chars

# ---- Runtime Stage ----
# gcr.io/distroless/nodejs20-debian12 ist kleiner als node:20-alpine,
# da es ausschließlich die Node.js-Runtime ohne Shell, npm oder Alpine-Tools enthält.
FROM gcr.io/distroless/nodejs20-debian12

WORKDIR /app
ENV NODE_ENV=production

# Nur die relevanten Artefakte aus dem Build-Stage übernehmen
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/bot.js ./bot.js
COPY --from=build /app/deploy-commands.js ./deploy-commands.js
COPY --from=build /app/commands ./commands
COPY --from=build /app/events ./events
COPY --from=build /app/common ./common
COPY --from=build /app/managers ./managers
COPY --from=build /app/handlers ./handlers
COPY --from=build /app/data ./data
COPY --from=build /app/tables ./tables
COPY --from=build /app/tools ./tools
COPY --from=build /app/package.json ./package.json
# Leere Verzeichnisse für Volume-Mounts
COPY --from=build /app/storage ./storage
COPY --from=build /app/chars ./chars

# Declare volumes for external data
# /app/chars       - Charakter-JSON-Dateien
# /app/storage     - Event-History (NDJSON)
# /app/config.json - wird als Bind-Mount übergeben
VOLUME ["/app/chars", "/app/storage"]

# Standard: Bot starten
# Alternativ: deploy-commands.js ausführen mit:
#   docker run --env-file .env ... dsa-bot-v2 deploy-commands.js
#   oder via docker-compose: docker compose run --rm deploy
CMD ["bot.js"]

