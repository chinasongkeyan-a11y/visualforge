FROM node:24-slim

# System dependencies:
# - libcairo2 libpango libjpeg libgif librsvg2: @napi-rs/canvas native libraries
# - ffmpeg: video encoding
# - fonts-wqy-microhei: Chinese font for text rendering
RUN apt-get update && apt-get install -y --no-install-recommends \
    libcairo2 \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    ffmpeg \
    fonts-wqy-microhei \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Enable pnpm
RUN corepack enable pnpm

# Copy dependency files first for better layer caching
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the project
RUN pnpm build

# Create renders directory for video output
RUN mkdir -p /app/renders

# Environment
ENV NODE_ENV=production
ENV COZE_PROJECT_ENV=PROD
ENV PORT=5000
ENV RENDERS_DIR=/app/renders

EXPOSE 5000

CMD ["node", "dist/server.js"]
