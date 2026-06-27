#!/bin/bash
set -Eeuo pipefail

echo "Building VisualForge Docker image..."
docker build -t visualforge:latest .

echo ""
echo "Image built successfully!"
echo ""
echo "To run with docker:"
echo "  docker run -d --name visualforge -p 5000:5000 -v \$(pwd)/renders:/app/renders visualforge:latest"
echo ""
echo "To run with docker-compose:"
echo "  docker-compose up -d"
echo ""
echo "Then visit: http://localhost:5000"
