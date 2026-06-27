#!/bin/bash
# ============================================================
# VisualForge Docker 镜像一键构建 + 导出脚本
# 
# 使用方法：
#   1. 把整个项目目录拷到任意安装了 Docker 的 Linux/Mac 电脑
#   2. 在项目根目录执行: bash build-image.sh
#   3. 等待构建完成，生成 visualforge.tar.gz
#   4. 将 visualforge.tar.gz 上传到极空间 NAS
#   5. 在极空间 Docker 管理器 → 镜像管理 → 导入镜像
#
# 导入后创建容器配置：
#   端口映射: 7777 → 7777
#   目录映射: /你的路径/renders → /app/renders
#   环境变量: PORT=7777
# ============================================================

set -e

IMAGE_NAME="visualforge"
IMAGE_TAG="latest"
OUTPUT_FILE="visualforge.tar.gz"

echo "=========================================="
echo "  VisualForge Docker Image Builder"
echo "=========================================="
echo ""

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker not found. Please install Docker first."
    echo "  https://docs.docker.com/engine/install/"
    exit 1
fi

echo "[1/4] Checking Docker..."
docker --version
echo ""

# 检查 Dockerfile
if [ ! -f "Dockerfile" ]; then
    echo "[ERROR] Dockerfile not found. Please run this script in the project root directory."
    exit 1
fi

echo "[2/4] Building Docker image: ${IMAGE_NAME}:${IMAGE_TAG}"
echo "  This may take 3-10 minutes (downloading base image, installing deps)..."
echo ""
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
echo ""
echo "  Build completed!"
echo ""

echo "[3/4] Exporting image to ${OUTPUT_FILE}..."
echo "  This may take 1-2 minutes..."
docker save ${IMAGE_NAME}:${IMAGE_TAG} | gzip > ${OUTPUT_FILE}
echo "  Export completed!"
echo ""

echo "[4/4] Verifying..."
FILE_SIZE=$(du -h ${OUTPUT_FILE} | cut -f1)
echo "  Output file: ${OUTPUT_FILE}"
echo "  File size: ${FILE_SIZE}"
echo ""

echo "=========================================="
echo "  Done!"
echo "=========================================="
echo ""
echo "  Upload '${OUTPUT_FILE}' to your NAS,"
echo "  then import it in Docker Manager."
echo ""
echo "  Container config for ZSpace NAS:"
echo "    Port:     7777 -> 7777"
echo "    Volume:   /your/path/renders -> /app/renders"
echo "    Env:      PORT=7777"
echo ""
