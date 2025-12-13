# Quick Start Guide - SDN Dashboard

**Get the system running in 3 minutes!**

---

## Prerequisites Check

```bash
# Verify Node.js installed
node --version   # Should be v18+

# Verify npm installed
npm --version    # Should be 8+

# Verify OMNeT++ (Required for full simulation)
omnetpp -v      # Should show version 6.0+
```

---

## First Time Setup (Run Once)

Before running the system for the first time, you must build the simulation and install dependencies.

### 1. Build the Simulation
```bash
# Go to simulation directory
cd sdn_dashboard/simulations

# Adjust path to where you installed OMNeT++ (relative to sdn_dashboard/simulations)
source ../../../tj_omnet/setenv

# Copy controller files
cp ../src/controller/SDNController.cc ./
cp ../src/controller/SDNController.h ./

# Create Makefile and Build
opp_makemake -f --deep -o sdn_sim -I$INET_ROOT/src -I../../../inet/src -L$INET_ROOT/src -L../../../inet/src -lINET
make MODE=release
```

### 2. Install Project Dependencies
```bash
# Backend
cd ../dashboard/backend
npm install

# Frontend
cd ../frontend
npm install
```

---

## Running the Full System

To run the complete experiment with real-time feedback, you need **3 separate terminals**.

### Terminal 1: Start the Simulation Engine
This runs the OMNeT++ simulation which models the network traffic.

```bash
cd sdn_dashboard/simulations
# Adjust path to where you installed OMNeT++ (relative to sdn_dashboard/simulations)
source ../../../tj_omnet/setenv
./sdn_sim -u Cmdenv -n .:../src:../../../inet/src
```
*Note: Keep this terminal open! It processes the commands from the dashboard.*

### Terminal 2: Start the Backend Server
This acts as the bridge between the simulation and the web UI.

```bash
cd sdn_dashboard/dashboard/backend
npm start
```

### Terminal 3: Start the Frontend Dashboard
This is the web interface you interact with.

```bash
cd sdn_dashboard/dashboard/frontend
npm start
```

**Access the Dashboard:** Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Recreating Experiments

Once the system is running (Terminals 1, 2, and 3 active), follow these steps to reproduce the report results.

### Experiment 1: High Throughput Test (Stress Test)

1. Navigate to the **Experiments** tab in the Dashboard.
2. Select **Scenario Preset: High Throughput**.
   - **Tenant Count:** 3
   - **Slice Count:** 3
   - **Traffic Load:** High
   - **ACL Pattern:** Open (Allow All)
3. Click **Start Experiment**.
4. The dashboard will automatically switch to the **Results (Live)** tab.
5. **Observe:** The **Throughput** graph will rise to exceed **140 Mbps**, validating the system's performance under dynamic load.

### Experiment 2: QoS Challenge (Video vs. Backup)

1. Navigate to the **Experiments** tab and click **Start Manual Session (Live)**.
2. Switch to the **Network Control** tab (main view).
3. **Create Initial Low-BW Slices:**
   - In the **Slice Panel** (right side), click **+ Create Slice**.
   - **Slice 1:** Name: `Video Stream`, VLAN: `10`, Bandwidth: `20` Mbps, Hosts: `10.0.10.1, 10.0.10.2`.
   - **Slice 2:** Name: `Background Backup`, VLAN: `20`, Bandwidth: `20` Mbps, Hosts: `10.0.20.1, 10.0.20.2`.
4. Switch to the **Experiments -> Results** tab. Note the low baseline throughput.
5. **Simulate Dynamic Policy Update:**
   - Return to **Network Control**.
   - **Delete** the `Video Stream` slice (Click '×').
   - Immediately **Recreate** it with **Bandwidth: 100 Mbps** (Name: `Video Stream`, VLAN: `10`, Hosts: `10.0.10.1, 10.0.10.2`).
6. Return to the **Results** tab.
7. **Observe:** The Video Stream throughput will spike and stabilize at the new **100 Mbps** limit, while the Background Backup remains constant at 20 Mbps.

---

## Shutdown

To stop the system, press `Ctrl+C` in all three terminals.
