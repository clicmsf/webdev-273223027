FROM node:22-bookworm-slim

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY migrations/postgres ./migrations/postgres
COPY public ./public
COPY scripts ./scripts
COPY src ./src

USER node
EXPOSE 3000
CMD ["npm", "start"]
