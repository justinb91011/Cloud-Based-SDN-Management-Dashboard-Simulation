# SDN Dashboard - Cloud-Based SDN Management System

**Version:** 1.0
**Status:** Production Ready ✅
**Authors:** Justin and Taran
**Institution:** Johns Hopkins University

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Architecture](#architecture)
4. [Prerequisites](#prerequisites)
5. [Installation](#installation)
6. [Quick Start](#quick-start)
7. [Usage Guide](#usage-guide)
8. [API Documentation](#api-documentation)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)
11. [File Locations](#file-locations)
12. [Known Issues](#known-issues)
13. [Contributing](#contributing)

---

## Overview

The **SDN Dashboard** is a full-stack web-based management system for Software-Defined Networking (SDN) environments. It provides interactive control and visualization for two key SDN abstractions:

1. **Network Slicing**: Create, delete, and configure virtual networks on shared cloud topology
2. **Dynamic Flow Provisioning**: Add and remove OpenFlow rules interactively for on-demand connections

The system consists of three main components:
- **OMNeT++ Simulation**: Network simulation with SDN controller
- **Backend Server**: Node.js/Express REST API with WebSocket support
- **Frontend Dashboard**: React-based web interface with D3.js visualization

---

## Features

### Network Slicing
- ✅ Create virtual network slices with custom VLAN IDs
- ✅ Assign hosts and bandwidth allocation per slice
- ✅ Traffic isolation between slices
- ✅ Real-time slice monitoring
- ✅ Interactive slice management via web UI

### Dynamic Flow Provisioning
- ✅ Add/remove OpenFlow rules dynamically
- ✅ Configure match fields (src/dst IP, ports)
- ✅ Set actions (forward, drop, modify)
- ✅ Priority-based flow rule ordering
- ✅ Real-time flow statistics (packets, bytes)

### Visualization
- ✅ D3.js-powered network topology view
- ✅ Interactive zoom and pan
- ✅ Color-coded nodes by type and slice
- ✅ Real-time topology updates
- ✅ Hierarchical layout (Core → Aggregation → Edge)

### Real-Time Updates
- ✅ WebSocket-based live data synchronization
- ✅ Automatic dashboard refresh on state changes
- ✅ Bidirectional communication (Dashboard ↔ Simulation)
- ✅ File watcher for simulation state changes

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│                  http://localhost:3000                      │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Topology    │  │    Slice     │  │    Flow      │    │
│  │    View      │  │  Management  │  │  Management  │    │
│  │  (D3.js)     │  │   (CRUD)     │  │   (CRUD)     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP REST + WebSocket
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Node.js/Express)                  │
│                  http://localhost:3001                      │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  REST API    │  │  WebSocket   │  │    File      │    │
│  │ 13 endpoints │  │   Server     │  │   Watcher    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │ JSON Files
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                   OMNeT++ Simulation                        │
│                                                             │
│  ┌──────────────────────────────────────────────────┐     │
│  │         SDN Controller (C++)                      │     │
│  │  - Network Slicing (VLAN-based)                  │     │
│  │  - Flow Management (OpenFlow)                    │     │
│  │  - Command Processing                             │     │
│  │  - State Export (JSON)                            │     │
│  └──────────────────────────────────────────────────┘     │
│                                                             │
│  ┌──────────────────────────────────────────────────┐     │
│  │         Cloud Topology (21 nodes)                 │     │
│  │  - 1 Controller                                   │     │
│  │  - 8 Switches (Core: 2, Agg: 3, Edge: 3)        │     │
│  │  - 12 Hosts (4 per slice)                        │     │
│  └──────────────────────────────────────────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### Required Software

1. **OMNeT++ 6.0+**
   - Network simulation framework
   - Download: https://omnetpp.org/

2. **INET Framework 4.5+**
   - Protocol models for OMNeT++
   - Download: https://inet.omnetpp.org/

3. **Node.js 18+**
   - JavaScript runtime for backend
   - Download: https://nodejs.org/

4. **npm** (comes with Node.js)
   - Package manager

5. **Modern Web Browser**
   - Chrome, Firefox, Safari, or Edge
   - JavaScript enabled

### Recommended Tools

- **curl** - For API testing
- **Git** - Version control
- **Code editor** - VS Code, Sublime, etc.

---

## Installation

### Step 1: Clone Repository

```bash
cd ~/Desktop/JHUFall2025/Cloud
git clone <repository-url>
cd Cloud-Based-SDN-Management-Dashboard-Simulation
```

### Step 2: Verify OMNeT++ Installation

```bash
# Check OMNeT++ version
omnetpp -v

# Source OMNeT++ environment (if needed)
cd ~/Desktop/JHUFall2025/Cloud/tj_omnet
source setenv
```

### Step 3: Install Backend Dependencies

```bash
cd sdn_dashboard/dashboard/backend
npm install
```

**Expected:** 139 packages installed

### Step 4: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

**Expected:** 1,362 packages installed

### Step 5: Build Simulation (Optional)

If you want full bidirectional integration with OMNeT++:

```bash
cd ../../simulations
opp_makemake -f --deep -o sdn_sim -I../../../../inet/src -L../../../../inet/src -lINET
make MODE=release
```

---

## Quick Start

### Option A: Backend + Frontend Only (Demo Mode)

Use pre-generated state files without running simulation.

#### Terminal 1: Start Backend

```bash
cd sdn_dashboard/dashboard/backend
npm start
```

**Expected Output:**
```
============================================================
SDN Dashboard Backend Server
============================================================
Server running on http://localhost:3001
Loaded state: 3 slices, 12 flows
Loaded topology: 21 nodes
============================================================
```

#### Terminal 2: Start Frontend

```bash
cd sdn_dashboard/dashboard/frontend
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view sdn-dashboard-frontend in the browser.

  Local:            http://localhost:3000
```

Browser opens automatically to dashboard.

---

### Option B: Full Integration with Simulation

For bidirectional control with live OMNeT++ simulation.

#### Terminal 1: Start Simulation

```bash
cd sdn_dashboard/simulations
./sdn_sim -u Cmdenv -c General
```

Leave running. It exports state files and processes commands.

#### Terminal 2: Start Backend

```bash
cd sdn_dashboard/dashboard/backend
npm start
```

#### Terminal 3: Start Frontend

```bash
cd sdn_dashboard/dashboard/frontend
npm start
```

Now changes in dashboard are executed by simulation!

---

## Usage Guide

### Accessing the Dashboard

Open browser to: **http://localhost:3000**

**Dashboard Layout:**
- **Top:** Statistics bar (slices, flows, hosts, switches)
- **Left (60%):** Network topology visualization
- **Right Top (40%):** Slice management panel
- **Right Bottom (40%):** Flow rules panel

---

### Creating a Network Slice

1. Click **"+ Create Slice"** button in Slice Panel
2. Fill in the form:
   - **Name**: Descriptive name (e.g., "Production_Env")
   - **VLAN ID**: Unique VLAN identifier (e.g., 40)
   - **Bandwidth**: Allocation in Mbps (e.g., 200)
   - **Hosts**: Comma-separated IPs (e.g., "10.0.40.1, 10.0.40.2")
   - **Isolated**: Check for traffic isolation
3. Click **"Create"** button

**Result:**
- New slice appears in list
- Backend writes command to `results/commands.json`
- If simulation running: Controller creates slice
- Topology highlights new hosts
- Statistics update

---

### Adding a Flow Rule

1. **Select a slice** by clicking it in the Slice Panel
2. Click **"+ Add Flow"** button in Flow Panel
3. Fill in the form:
   - **Source IP**: Origin host (e.g., "10.0.10.1")
   - **Destination IP**: Target host (e.g., "10.0.10.2")
   - **Action**: Choose from dropdown:
     - `forward` - Allow traffic
     - `drop` - Block traffic
     - `modify` - Transform packets
   - **Priority**: Rule priority (higher = more important, e.g., 200)
4. Click **"Add Flow"** button

**Result:**
- New flow appears in table
- Backend writes ADD_FLOW command
- If simulation running: Flow installed in controller
- Statistics display packets/bytes matched

---

### Deleting Resources

#### Delete a Slice
1. Locate slice card in Slice Panel
2. Click **"×"** button on top-right of card
3. Confirm deletion (if prompted)
4. Slice and associated flows removed

#### Delete a Flow
1. Locate flow row in Flow Panel table
2. Click **"Delete"** button in Actions column
3. Flow removed immediately

---

### Viewing Topology

**Interaction:**
- **Zoom**: Mouse wheel up/down
- **Pan**: Click and drag canvas
- **Select Slice**: Click slice card to highlight hosts

**Node Colors:**
- 🔴 **Red**: SDN Controller
- 🔵 **Teal**: Switches
- 🟢 **Green/Blue/Yellow**: Hosts (by slice)
- ⚫ **Gray**: Unselected hosts

**Layout:**
- Top tier: Controller
- Middle tiers: Core and Aggregation switches
- Bottom tier: Edge switches and hosts

---

## API Documentation

### Base URL

```
http://localhost:3001/api
```

### Endpoints

#### Health Check

```
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "uptime": 123.45,
  "timestamp": "2025-11-05T10:30:00Z",
  "dataLoaded": {
    "slices": 3,
    "flows": 12,
    "nodes": 21
  }
}
```

---

#### Get Topology

```
GET /api/topology
```

**Response:**
```json
{
  "nodes": [
    { "id": "controller", "type": "controller" },
    { "id": "coreSwitch1", "type": "switch" },
    { "id": "host0", "type": "host", "slice": 0 }
  ],
  "links": []
}
```

---

#### Get All Slices

```
GET /api/slices
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Tenant_A",
    "vlanId": 10,
    "bandwidth": 100,
    "isolated": true,
    "hosts": ["10.0.10.1", "10.0.10.2", "10.0.10.3", "10.0.10.4"]
  }
]
```

---

#### Get Specific Slice

```
GET /api/slices/:id
```

**Parameters:**
- `id` (integer) - Slice ID

**Response:** Single slice object (see above)

---

#### Create Slice

```
POST /api/slices
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "NewSlice",
  "vlanId": 40,
  "bandwidth": 150,
  "hosts": ["10.0.40.1", "10.0.40.2"],
  "isolated": true
}
```

**Response:** Created slice object with ID (201 Created)

---

#### Update Slice

```
PUT /api/slices/:id
Content-Type: application/json
```

**Request Body:** Fields to update
```json
{
  "bandwidth": 200
}
```

**Response:** Updated slice object

---

#### Delete Slice

```
DELETE /api/slices/:id
```

**Response:** Deleted slice object (200 OK)

---

#### Get All Flows

```
GET /api/flows
GET /api/flows?sliceId=1   # Filter by slice
```

**Response:**
```json
[
  {
    "id": 1,
    "srcIP": "10.0.10.1",
    "dstIP": "10.0.10.2",
    "action": "forward",
    "priority": 100,
    "sliceId": 1,
    "packets": 0,
    "bytes": 0
  }
]
```

---

#### Create Flow

```
POST /api/flows
Content-Type: application/json
```

**Request Body:**
```json
{
  "srcIP": "10.0.10.1",
  "dstIP": "10.0.10.2",
  "action": "forward",
  "priority": 100,
  "sliceId": 1
}
```

**Response:** Created flow object (201 Created)

---

#### Delete Flow

```
DELETE /api/flows/:id
```

**Response:** Deleted flow object (200 OK)

---

#### Get Statistics

```
GET /api/statistics
```

**Response:**
```json
{
  "totalSlices": 3,
  "totalFlows": 12,
  "totalHosts": 12,
  "totalSwitches": 8,
  "timestamp": 5.0
}
```

---

### WebSocket Connection

```
ws://localhost:3001
```

**Messages:**

**INITIAL_STATE** (on connect):
```json
{
  "type": "INITIAL_STATE",
  "data": {
    "slices": [ /* slice array */ ],
    "flows": [ /* flow array */ ],
    "timestamp": 5.0
  }
}
```

**STATE_UPDATE** (on change):
```json
{
  "type": "STATE_UPDATE",
  "data": { /* updated state */ }
}
```

---

## Testing

### Automated Integration Tests

Run the complete test suite:

```bash
cd sdn_dashboard
./test_integration.sh
```

**Expected:** 20/20 tests pass

**Test Coverage:**
- Backend health check
- All 13 API endpoints
- Create/delete operations
- Bidirectional sync
- WebSocket connectivity
- Command file processing
- State persistence

**Results saved to:** `test_results.txt`

---

### Manual Test Scenarios

See detailed manual testing procedures:

```bash
cat test_scenarios.md
```

**Scenarios:**
1. Basic Slice Management
2. Flow Rule Management
3. Slice Isolation Testing
4. Real-Time Synchronization
5. Topology Visualization
6. Error Handling

---

## Troubleshooting

### Issue: Backend won't start

**Symptoms:**
- Error: "EADDRINUSE: address already in use :::3001"

**Solution:**
```bash
# Find and kill process using port 3001
lsof -ti:3001 | xargs kill -9

# Restart backend
cd sdn_dashboard/dashboard/backend
npm start
```

---

### Issue: Frontend won't start

**Symptoms:**
- Error: "Something is already running on port 3000"

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm start
```

---

### Issue: Backend shows "State file not found"

**Symptoms:**
- Warning: "State file not found: results/controller_state.json"

**Solution:**
```bash
# Ensure results directory exists
mkdir -p sdn_dashboard/simulations/results

# Copy sample state files (if available)
cp sdn_dashboard/simulations/results/*.json.sample sdn_dashboard/simulations/results/
```

---

### Issue: Dashboard shows no data

**Symptoms:**
- Empty slice panel
- Empty flow table
- Topology not rendering

**Solution:**
1. Check backend is running:
   ```bash
   curl http://localhost:3001/api/health
   ```

2. Check browser console (F12) for errors

3. Verify WebSocket connection:
   - Look for "WebSocket connected" in console
   - Check Network tab for WS connection

4. Restart both backend and frontend

---

### Issue: Changes don't reflect in simulation

**Symptoms:**
- Dashboard updates but `controller_state.json` unchanged

**Solution:**
1. Verify simulation is running:
   ```bash
   ps aux | grep sdn_sim
   ```

2. Check if command processing is enabled:
   - Look for "Command processing enabled" in simulation output

3. Verify command file is written:
   ```bash
   cat sdn_dashboard/simulations/results/commands.json
   ```

4. Check simulation has file permissions:
   ```bash
   ls -la sdn_dashboard/simulations/results/
   ```

---

### Issue: Simulation won't compile

**Symptoms:**
- Errors during `make`

**Solution:**
1. Check OMNeT++ environment:
   ```bash
   omnetpp -v
   echo $PATH | grep omnetpp
   ```

2. Re-source environment:
   ```bash
   cd ~/Desktop/JHUFall2025/Cloud/tj_omnet
   source setenv
   ```

3. Verify INET path in Makefile

4. Clean and rebuild:
   ```bash
   make clean
   make MODE=release
   ```

---

## File Locations

### Configuration Files

- **Backend**: `sdn_dashboard/dashboard/backend/server.js`
- **Frontend**: `sdn_dashboard/dashboard/frontend/package.json`
- **Simulation**: `sdn_dashboard/simulations/omnetpp.ini`

### Data Files

- **Controller State**: `sdn_dashboard/simulations/results/controller_state.json`
- **Topology**: `sdn_dashboard/simulations/results/topology.json`
- **Commands** (Dashboard → Simulation): `sdn_dashboard/simulations/results/commands.json`

### Logs

- **Backend Logs**: Console output (Terminal 1)
- **Frontend Logs**: Browser console (F12)
- **Simulation Logs**: OMNeT++ output (Terminal 3)

### Test Results

- **Integration Tests**: `test_results.txt`
- **Test Scenarios**: `test_scenarios.md`

---

## Known Issues

### Limitations

1. **No User Authentication**: System is open, no login required
   - Suitable for development/demo only
   - Production deployment needs authentication

2. **Single User**: No multi-user support
   - Concurrent edits may conflict
   - WebSocket broadcasts to all clients

3. **No Persistence Database**: State stored in JSON files
   - Restarts reset to last saved state
   - No transaction support

4. **Simplified Command Parsing**: String-based JSON parsing in C++
   - Production should use proper JSON library
   - Limited error checking

5. **Fixed Topology**: Topology layout is static
   - Dynamic topology changes not yet supported
   - Layout not force-directed

### Future Enhancements

See `PHASE6_COMPLETE.md` for roadmap.

---

## Contributing

### Development Workflow

1. Create feature branch
2. Make changes
3. Run tests: `./test_integration.sh`
4. Commit with descriptive message
5. Create pull request

### Code Style

- **C++**: Follow OMNeT++ conventions
- **JavaScript**: Use ESLint with Airbnb config
- **React**: Functional components with hooks

### Testing

- All new features require tests
- Update `test_scenarios.md` for manual tests
- Maintain 100% pass rate on integration tests

---

## License

This project is developed for academic purposes at Johns Hopkins University.

---

## Support

For issues, questions, or contributions:

- **Documentation**: `implementation.md`, `PHASE6_COMPLETE.md`
- **Test Guide**: `test_scenarios.md`
- **Authors**: Justin and Taran

---

## Acknowledgments

- **OMNeT++** - Discrete event simulator
- **INET Framework** - Network protocol models
- **React** - Frontend UI library
- **D3.js** - Data visualization library
- **Express** - Backend web framework

---

**Version:** 1.0
**Last Updated:** November 5, 2025
**Status:** ✅ Production Ready
