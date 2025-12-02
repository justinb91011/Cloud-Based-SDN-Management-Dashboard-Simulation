# Setup Guide - Cloud-Based SDN Management Dashboard

**Complete installation guide from scratch after cloning the repository**

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [OMNeT++ Configuration](#omnet-configuration)
4. [Building the Simulation](#building-the-simulation)
5. [Backend Setup](#backend-setup)
6. [Frontend Setup](#frontend-setup)
7. [Verification](#verification)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Version | Purpose | Download Link |
|----------|---------|---------|---------------|
| **OMNeT++** | 6.0+ | Network simulator | https://omnetpp.org/ |
| **INET Framework** | 4.5+ | Network protocols | https://inet.omnetpp.org/ |
| **Node.js** | 18+ | Backend runtime | https://nodejs.org/ |
| **npm** | 8+ | Package manager | Included with Node.js |
| **C++ Compiler** | GCC/Clang | Compile C++ code | Usually pre-installed |
| **Git** | Any | Version control | https://git-scm.com/ |

### Operating System

- **macOS**: Fully supported ✅
- **Linux**: Fully supported ✅
- **Windows**: Use WSL2 (Windows Subsystem for Linux)

---

## Initial Setup

### Step 1: Clone the Repository

```bash
cd ~/Desktop/JHUFall2025/Cloud
git clone <repository-url> Cloud-Based-SDN-Management-Dashboard-Simulation
cd Cloud-Based-SDN-Management-Dashboard-Simulation
```

### Step 2: Verify Directory Structure

```bash
ls -la
```

**Expected directories:**
```
sdn_dashboard/
├── dashboard/
│   ├── backend/
│   └── frontend/
├── simulations/
│   ├── networks/
│   └── results/
└── src/
    └── controller/
```

If this structure exists, you're ready to proceed! ✅

---

## OMNeT++ Configuration

### Step 1: Install OMNeT++

#### macOS Installation

1. **Download OMNeT++:**
   ```bash
   cd ~/Desktop/JHUFall2025/Cloud
   wget https://github.com/omnetpp/omnetpp/releases/download/omnetpp-6.0.1/omnetpp-6.0.1-macos-x86_64.tgz
   tar xvf omnetpp-6.0.1-macos-x86_64.tgz
   mv omnetpp-6.0.1 tj_omnet
   ```

2. **Set environment variables:**
   ```bash
   cd tj_omnet
   source setenv
   ```

3. **Verify installation:**
   ```bash
   omnetpp -v
   ```

   **Expected output:**
   ```
   OMNeT++ Discrete Event Simulation  (C) 1992-2024 Andras Varga, OpenSim Ltd.
   Version: 6.0.1
   ```

#### Linux Installation

```bash
cd ~/Desktop/JHUFall2025/Cloud
wget https://github.com/omnetpp/omnetpp/releases/download/omnetpp-6.0.1/omnetpp-6.0.1-linux-x86_64.tgz
tar xvf omnetpp-6.0.1-linux-x86_64.tgz
mv omnetpp-6.0.1 tj_omnet
cd tj_omnet
source setenv
./configure
make
```

---

### Step 2: Install INET Framework

1. **Download INET:**
   ```bash
   cd ~/Desktop/JHUFall2025/Cloud
   wget https://github.com/inet-framework/inet/releases/download/v4.5.0/inet-4.5.0-src.tgz
   tar xvf inet-4.5.0-src.tgz
   mv inet4.5 inet
   ```

2. **Build INET:**
   ```bash
   cd inet
   make makefiles
   make MODE=release -j4
   ```

   **This will take 10-15 minutes.** ⏳

3. **Verify INET build:**
   ```bash
   ls src/INET
   ```

   **Expected:** You should see `libINET.so` (Linux) or `libINET.dylib` (macOS)

---

### Step 3: Set Up Environment (Permanent)

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
# OMNeT++ Environment
export OMNETPP_ROOT=~/Desktop/JHUFall2025/Cloud/tj_omnet
source $OMNETPP_ROOT/setenv

# INET Framework
export INET_ROOT=~/Desktop/JHUFall2025/Cloud/inet
```

**Reload shell:**
```bash
source ~/.bashrc  # or source ~/.zshrc for macOS
```

**Verify:**
```bash
echo $OMNETPP_ROOT
echo $INET_ROOT
```

Both should show paths. ✅

---

## Building the Simulation

The simulation is built directly in the `simulations/` directory with controller source files.

### Step 1: Copy Controller Files to Simulations Directory

```bash
cd ~/Desktop/JHUFall2025/Cloud/Cloud-Based-SDN-Management-Dashboard-Simulation/sdn_dashboard/simulations

# Copy controller source files
cp ../src/controller/SDNController.cc ./
cp ../src/controller/SDNController.h ./
```

**Why?** The OMNeT++ build system compiles everything together in the simulations directory.

---

### Step 2: Source OMNeT++ Environment

**CRITICAL:** You must source the OMNeT++ environment before building:

```bash
source ~/Desktop/JHUFall2025/Cloud/tj_omnet/setenv
```

**Expected output:**
```
NOTE: We are running on Apple Silicon, but you have downloaded the x86_64 version...
Environment for 'omnetpp-6.0.1' in directory '... /tj_omnet' is ready.
```

---

### Step 3: Create Makefile

```bash
opp_makemake -f --deep \
  -o sdn_sim \
  -I$INET_ROOT/src \
  -I../../../inet/src \
  -L$INET_ROOT/src \
  -L../../../inet/src \
  -lINET
```

**What this does:**
- `-o sdn_sim` - Names the output executable
- `-I` flags - Include directories for headers
- `-L` flags - Library search paths
- `-lINET` - Links against INET Framework

---

### Step 4: Build

```bash
make clean
make MODE=release
```

**Expected output:**
```
Creating executable: sdn_sim
```

**Build time:** 30-60 seconds ⏱️

---

### Step 5: Verify Build

``` bash
ls -lh sdn_sim
```

**Expected:** `sdn_sim` executable, approximately 100-200 KB

```bash
ls -lh out/clang-release/sdn_sim
```

**Expected:** Actual binary in `out/clang-release/`, approximately 100-200 KB

✅ If both exist, build successful!

---

### Step 6: Test the Simulation

**Source environment first:**
```bash
source ~/Desktop/JHUFall2025/Cloud/tj_omnet/setenv
```

**Run a 10-second test:**
```bash
./sdn_sim -u Cmdenv -n .:../src:../../../inet/src --sim-time-limit=10s
```

**Expected output:**
```
OMNeT++ Discrete Event Simulation  (C) 1992-2024 Andras Varga, OpenSim Ltd.
Version: 6.0.1

Loading NED files from .: 4
Preparing for running configuration SimpleTopology, run #0...

Initializing...
** Event #1  t=0   Elapsed: 0.000s (0m 00s)
SDN Controller initializing on port 6653
Created network slice 1 (Tenant_A)
Created network slice 2 (Tenant_B)
Created network slice 3 (Tenant_C)
Installed flow rule 1 from 10.0.10.1 to
Installed flow rule 2 from 10.0.10.2 to
...
Installed flow rule 12 from 10.0.30.4 to
Command processing enabled. Checking results/commands.json every 1 second.

Running simulation...
** Event #100  t=1   ...
** Event #200  t=2   ...
...
<!> Simulation time limit reached -- at t=10s
```

**Success indicators:**
- ✅ No compilation errors
- ✅ SDN Controller initializes
- ✅ 3 network slices created (Tenant_A, B, C)
- ✅ 12 flow rules installed (4 per slice)
- ✅ Command processing enabled
- ✅ Simulation runs and processes events

---

### Step 7: Verify Generated Files

```bash
ls -la results/
```

**Expected files:**
```
metrics.json               ← Real-time metrics data (CRITICAL for dashboard)
controller_state.json      ← Network slices and flows
topology.json              ← Network topology (21 nodes)
commands.json              ← Commands from dashboard
General-#0.vec             ← OMNeT++ vector results
General-#0.vci             ← Vector index
```

**Check metrics.json:**
```bash
tail -20 results/metrics.json
```

**Expected:** JSON with timestamp, slices array, summary metrics, and history array:
```json
{
  "timestamp": 10,
  "slices": [
    {"sliceId": 1, "latency": 25, "throughput": 75},
    {"sliceId": 2, "latency": 18, "throughput": 120},
    {"sliceId": 3, "latency": 22, "throughput": 95}
  ],
  "summary": {
    "avgLatency": 21.67,
    "p95Latency": 24.5,
    "avgThroughput": 96.67,
    "aclHitRate": 0.85
  },
  "history": [
    {"timestamp": 1, "slices": [...]},
    ...
  ]
}
```

✅ If `metrics.json` exists and has this structure, simulation is working perfectly!

---

## Backend Setup

### Step 1: Install Dependencies

```bash
cd ~/Desktop/JHUFall2025/Cloud/Cloud-Based-SDN-Management-Dashboard-Simulation/sdn_dashboard/dashboard/backend
```

**Install packages:**
```bash
npm install
```

**Expected:** Installs ~139 packages (takes 1-2 minutes)

**Verify:**
```bash
ls node_modules/ | wc -l
```

Should show ~139. ✅

---

### Step 2: Verify Backend Configuration

Check that paths are correct in `server.js`:

```bash
grep -n "RESULTS_DIR\|STATE_FILE\|TOPOLOGY_FILE" server.js
```

**Expected output:**
```
16:const RESULTS_DIR = path.join(__dirname, '../../simulations/results');
17:const STATE_FILE = path.join(RESULTS_DIR, 'controller_state.json');
18:const TOPOLOGY_FILE = path.join(RESULTS_DIR, 'topology.json');
```

These paths should be correct. ✅

---

### Step 3: Test Backend Server

**Start server:**
```bash
npm start
```

**Expected output:**
```
============================================================
SDN Dashboard Backend Server
============================================================
Server running on http://localhost:3001
API available at http://localhost:3001/api
WebSocket available at ws://localhost:3001
------------------------------------------------------------
Loading simulation data...
Loaded state: 3 slices, 12 flows
Loaded topology: 21 nodes
Watching directory: .../results
============================================================

Available endpoints:
  GET  /api/health
  GET  /api/topology
  GET  /api/slices
  ...
============================================================
```

**Test health endpoint (in another terminal):**
```bash
curl http://localhost:3001/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "uptime": 5.123,
  "timestamp": "2025-11-05T...",
  "dataLoaded": {
    "slices": 3,
    "flows": 12,
    "nodes": 21
  }
}
```

Success! ✅ Press `Ctrl+C` to stop the server for now.

---

## Frontend Setup

### Step 1: Install Dependencies

```bash
cd ~/Desktop/JHUFall2025/Cloud/Cloud-Based-SDN-Management-Dashboard-Simulation/sdn_dashboard/dashboard/frontend
```

**Install packages:**
```bash
npm install
```

**Expected:** Installs ~1,362 packages (takes 3-5 minutes) ⏳

**Verify:**
```bash
ls node_modules/ | wc -l
```

Should show ~1,300+. ✅

---

### Step 2: Verify Frontend Configuration

Check API endpoint in `src/services/api.js`:

```bash
grep -n "baseURL\|localhost" src/services/api.js
```

**Expected:**
```
const API_BASE_URL = 'http://localhost:3001/api';
const WS_URL = 'ws://localhost:3001';
```

Correct! ✅

---

### Step 3: Test Frontend Build

**Build the app:**
```bash
npm run build
```

**Expected output:**
```
Creating an optimized production build...
Compiled successfully!

File sizes after gzip:
  ...
The build folder is ready to be deployed.
```

If build succeeds, you're good! ✅

---

## Verification

### Full System Test

Let's verify everything works together.

#### Terminal 1: Start Backend

```bash
cd ~/Desktop/JHUFall2025/Cloud/Cloud-Based-SDN-Management-Dashboard-Simulation/sdn_dashboard/dashboard/backend
npm start
```

**Wait for:** "Server running on http://localhost:3001"

---

#### Terminal 2: Start Frontend

```bash
cd ~/Desktop/JHUFall2025/Cloud/Cloud-Based-SDN-Management-Dashboard-Simulation/sdn_dashboard/dashboard/frontend
npm start
```

**Expected:**
```
Compiled successfully!

You can now view sdn-dashboard-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.x:3000
```

Browser should open automatically! 🎉

---

#### Terminal 3: Run Simulation (Optional)

For full bidirectional control:

```bash
cd ~/Desktop/JHUFall2025/Cloud/Cloud-Based-SDN-Management-Dashboard-Simulation/sdn_dashboard/simulations
./sdn_sim -u Cmdenv -c General
```

Leave this running.

---

### What You Should See

#### Dashboard (http://localhost:3000)

**Layout:**
- ✅ Top bar with statistics: `3 slices | 12 flows | 12 hosts | 8 switches`
- ✅ Left panel: Network topology visualization (21 nodes)
  - Red controller at top
  - Teal switches in middle
  - Colored hosts at bottom
- ✅ Right top panel: Slice management
  - 3 slices listed: Tenant_A, Tenant_B, Tenant_C
  - "+ Create Slice" button
- ✅ Right bottom panel: Flow rules table
  - 12 flow rules displayed
  - "+ Add Flow" button

If you see all of this, **SETUP IS COMPLETE!** ✅✅✅

---

## Troubleshooting

### Issue 1: OMNeT++ Not Found

**Error:** `omnetpp: command not found`

**Solution:**
```bash
cd ~/Desktop/JHUFall2025/Cloud/tj_omnet
source setenv
echo "source ~/Desktop/JHUFall2025/Cloud/tj_omnet/setenv" >> ~/.bashrc
```

---

### Issue 2: INET Library Not Found

**Error:** `cannot find -lINET`

**Solution:**
```bash
# Rebuild INET
cd ~/Desktop/JHUFall2025/Cloud/inet
make clean
make MODE=release -j4

# Verify library exists
ls src/INET/libINET.*
```

---

### Issue 3: Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3001`

**Solution:**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Or find and kill manually
lsof -i :3001
kill <PID>
```

Same for port 3000 (frontend).

---

### Issue 4: Backend Can't Find State Files

**Error:** `State file not found: results/controller_state.json`

**Solution:**
```bash
# Run simulation to generate files
cd sdn_dashboard/simulations
./sdn_sim -u Cmdenv -c General -t 5s

# Verify files created
ls -la results/*.json
```

---

### Issue 5: Simulation Won't Compile

**Error:** Various compilation errors

**Solution 1: Check paths**
```bash
echo $OMNETPP_ROOT
echo $INET_ROOT
# Should both show valid paths
```

**Solution 2: Clean and rebuild**
```bash
cd sdn_dashboard/src
make clean
opp_makemake -f --deep -o sdn_controller -I$INET_ROOT/src -L$INET_ROOT/src -lINET
make MODE=release
```

**Solution 3: Check INET build**
```bash
cd $INET_ROOT
make MODE=release
```

---

### Issue 6: npm install Fails

**Error:** Various npm errors

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and try again
rm -rf node_modules package-lock.json
npm install
```

---

### Issue 7: Frontend Build Errors

**Error:** TypeScript or React errors

**Solution:**
```bash
# Check Node.js version (must be 18+)
node --version

# If too old, update Node.js
# Then reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Quick Reference

### Start Everything (3 Terminals)

**Terminal 1 - OMNeT++ Simulation:**
```bash
cd ~/Desktop/JHUFall2025/Cloud/Cloud-Based-SDN-Management-Dashboard-Simulation/sdn_dashboard/simulations
source ~/Desktop/JHUFall2025/Cloud/tj_omnet/setenv
./sdn_sim -u Cmdenv -n .:../src:../../../inet/src
```

**Terminal 2 - Backend:**
```bash
cd ~/Desktop/JHUFall2025/Cloud/Cloud-Based-SDN-Management-Dashboard-Simulation/sdn_dashboard/dashboard/backend
npm start
```

**Terminal 3 - Frontend:**
```bash
cd ~/Desktop/JHUFall2025/Cloud/Cloud-Based-SDN-Management-Dashboard-Simulation/sdn_dashboard/dashboard/frontend
npm start
```

**Start in this order:** Simulation → Backend → Frontend

Browser opens automatically to http://localhost:3000 🎉

---

### Stop Everything

```bash
# Press Ctrl+C in each terminal

# Or kill all processes
lsof -ti:3000,3001 | xargs kill -9
killall sdn_sim
```

---

### Rebuild After Code Changes

**Controller changes (SDNController.cc/h):**
```bash
cd ~/Desktop/JHUFall2025/Cloud/Cloud-Based-SDN-Management-Dashboard-Simulation/sdn_dashboard/simulations
cp ../src/controller/SDNController.cc ./
cp ../src/controller/SDNController.h ./
source ~/Desktop/JHUFall2025/Cloud/tj_omnet/setenv
make clean && make MODE=release
```

**Simulation configuration changes (.ned/.ini):**
```bash
cd ~/Desktop/JHUFall2025/Cloud/Cloud-Based-SDN-Management-Dashboard-Simulation/sdn_dashboard/simulations
source ~/Desktop/JHUFall2025/Cloud/tj_omnet/setenv
make clean && make MODE=release
```

**Backend changes:**
```bash
# Just restart: Ctrl+C in Terminal 2, then
npm start
```

**Frontend changes:**
```bash
# Hot reload automatic, or restart: Ctrl+C in Terminal 3, then
npm start
```

---

## Next Steps

After setup is complete:

1. **Read the Usage Guide:** [USAGE.md](USAGE.md)
2. **Run Integration Tests:** `cd sdn_dashboard && ./test_integration.sh`
3. **Try Test Scenarios:** See [test_scenarios.md](sdn_dashboard/test_scenarios.md)
4. **Explore the Code:** Check [implementation.md](implementation.md)

---

## Summary Checklist

Before proceeding to usage, verify:

- [ ] OMNeT++ installed and `omnetpp -v` works
- [ ] INET Framework compiled (`$INET_ROOT/src/INET/libINET.*` exists)
- [ ] Controller module compiled (`sdn_dashboard/src/sdn_controller` exists)
- [ ] Simulation binary compiled (`sdn_dashboard/simulations/sdn_sim` exists)
- [ ] Simulation runs and generates state files
- [ ] Backend dependencies installed (139 packages)
- [ ] Backend starts and serves on port 3001
- [ ] Frontend dependencies installed (1,362 packages)
- [ ] Frontend starts and opens browser on port 3000
- [ ] Dashboard displays 3 slices, 12 flows, 21 nodes
- [ ] Can access http://localhost:3000 and see topology

**If all checked ✅, setup is complete!**

---

**Setup Time:** 30-60 minutes (depending on download speeds and compilation)

**Next:** [USAGE.md](USAGE.md) - Learn how to use the SDN Dashboard

---

**Questions?** Check:
- System docs: [README.md](sdn_dashboard/README.md)
- Phase 6 details: [PHASE6_COMPLETE.md](PHASE6_COMPLETE.md)
- Troubleshooting: This file, section above
