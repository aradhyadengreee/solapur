# FROM node:20-alpine

# WORKDIR /usr/src/app
# # Copy package files and install dependencies
# COPY package*.json ./
# RUN npm install --omit=dev
# # Copy app source code
# COPY . .
# # Expose port
# EXPOSE 8080
# # Use dumb-init as entrypoint for signal handling
# # ENTRYPOINT ["/usr/bin/dumb-init", "--"]
# # Start app with Puppeteer configured to use the installed Chromium
# CMD ["npm", "start"]

# ---- Base image ----
FROM node:20-alpine

# Install Chromium for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Puppeteer to use system-installed Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV NODE_ENV=production

WORKDIR /usr/src/app

# Install dependencies first (cache layer)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# Expose Cloud Run port
ENV PORT=8080
EXPOSE 8080

# Start
CMD ["npm", "start"]
