#!/bin/bash

# --- PharmaCore OS Automated Maintenance & Deployment Script ---
# Run this inside the target environment to fetch repository updates seamlessly.

# Set strict exit parameters if any command fails mid-execution
set -e

echo "=========================================================="
echo "   STARTING PHARMACORE SUITE DEPLOYMENT SYNCHRONIZATION   "
echo "=========================================================="
echo ""

# 1. Fetch the latest production release layer from the cloud vault
echo "[1/5] Pulling stable codebase modifications from GitHub..."
git checkout main
git pull origin main
echo "✔ Git pull execution complete."
echo ""

# 2. Ingest any newly added third-party backend packages
echo "[2/5] Updating Composer library frameworks..."
composer install --no-dev --optimize-autoloader
echo "✔ Composer dependencies optimized."
echo ""

# 3. Synchronize new database structural tables/columns if any exist
echo "[3/5] Syncing database structures across PostgreSQL schemas..."
php artisan migrate --force
echo "✔ Schema tables fully up to date."
echo ""

# 4. Re-compile production interface style maps and assets
echo "[4/5] Re-compiling frontend UI React components..."
npm install
npm run build
echo "✔ Vite static assets compiled successfully."
echo ""

# 5. Flush framework memory cells to load fresh definitions
echo "[5/5] Purging background application cache registries..."
php artisan optimize:clear
php artisan view:clear
echo "✔ Framework caches successfully cleared."
echo ""

echo "----------------------------------------------------------"
echo " SUCCESS: Target station infrastructure completely synced! "
echo " All systems functional on Port 8000.                     "
echo "----------------------------------------------------------"

