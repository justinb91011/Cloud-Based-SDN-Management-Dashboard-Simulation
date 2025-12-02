#!/bin/bash
set -e

echo "===== Building OMNeT++ SDN Dashboard ====="
echo "Sourcing OMNeT++ environment..."
source ~/Desktop/JHUFall2025/Cloud/tj_omnet/setenv

echo "Generating Makefile..."
cd ~/Desktop/JHUFall2025/Cloud/Cloud-Based-SDN-Management-Dashboard-Simulation/sdn_dashboard
opp_makemake -f --deep -O out -I.

echo "Cleaning previous build..."
make clean 2>/dev/null || true

echo "Building simulation..."
make MODE=release

echo "===== Build Complete ====="
echo "Executable: out/gcc-release/src/sdn_dashboard"
