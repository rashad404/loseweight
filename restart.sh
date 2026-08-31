#!/bin/bash

# LoseWeight.net local development
#   Backend  Laravel API   :8044
#   Frontend Next.js       :3044
# Reachable over Tailscale at http://100.89.150.50:<port>

echo "========================================="
echo "      Restarting LoseWeight.net"
echo "========================================="
echo ""

echo "Stopping existing services..."
for port in 8044 3044; do
    for pid in $(lsof -ti:$port 2>/dev/null); do
        kill -9 $pid 2>/dev/null
    done
    echo "   - port $port cleared"
done

pgrep -f 'next-render-worker|next-router-worker' | xargs kill -9 2>/dev/null

echo ""
echo "Starting backend API..."
cd ~/projects/loseweight/backend
php artisan serve --host=0.0.0.0 --port=8044 > /tmp/lw-backend.log 2>&1 &
sleep 2

echo "Starting frontend..."
cd ~/projects/loseweight/frontend
PORT=3044 npm run dev -- -H 0.0.0.0 > /tmp/lw-frontend.log 2>&1 &
sleep 4

echo ""
echo "========================================="
echo "      LoseWeight.net is up"
echo "========================================="
echo ""
echo "   Site      http://100.89.150.50:3044"
echo "   API       http://100.89.150.50:8044/api"
echo "   Local     http://localhost:3044"
echo ""
echo "   Logs      /tmp/lw-frontend.log"
echo "             /tmp/lw-backend.log"
echo ""
echo "========================================="
