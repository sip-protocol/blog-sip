#!/bin/bash
# VPS Setup Script for blog.sip-protocol.org
# Run on VPS as sip user: bash setup-vps.sh

set -e

echo "=== SIP Blog VPS Setup ==="

# 1. Create app directory if not exists
mkdir -p ~/app

# 2. Copy docker-compose.yml
cat > ~/app/docker-compose.yml << 'EOF'
name: sip-blog

services:
  blog:
    image: ghcr.io/sip-protocol/blog-sip:latest
    container_name: sip-blog
    restart: unless-stopped
    ports:
      - "5004:80"
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:80/"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s
    labels:
      - "com.docker.compose.project=sip-blog"
EOF

echo "✓ docker-compose.yml created"

# 3. Login to GHCR (requires PAT with read:packages scope)
echo "Logging in to GitHub Container Registry..."
echo "You may need to enter your GitHub PAT with read:packages scope"
# docker login ghcr.io -u sip-protocol

# 4. Pull and start
cd ~/app
docker compose pull blog
docker compose up -d blog

echo "✓ Container started"

# 5. Check status
docker ps | grep sip-blog

echo ""
echo "=== Next Steps ==="
echo "1. Copy deploy/nginx-vps.conf to /etc/nginx/sites-available/sip-blog.conf"
echo "2. sudo ln -s /etc/nginx/sites-available/sip-blog.conf /etc/nginx/sites-enabled/"
echo "3. sudo nginx -t && sudo systemctl reload nginx"
echo "4. sudo certbot --nginx -d blog.sip-protocol.org"
echo ""
echo "Done!"
