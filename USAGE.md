# Usage Guide - Cloud-Based SDN Management Dashboard

**How to use the SDN Dashboard after setup is complete**

---

## Table of Contents

1. [Starting the System](#starting-the-system)
2. [Dashboard Overview](#dashboard-overview)
3. [Managing Network Slices](#managing-network-slices)
4. [Managing Flow Rules](#managing-flow-rules)
5. [Topology Visualization](#topology-visualization)
6. [Understanding the Simulation](#understanding-the-simulation)
7. [Testing & Validation](#testing--validation)
8. [Advanced Usage](#advanced-usage)
9. [Tips & Best Practices](#tips--best-practices)

---

## Starting the System

### Quick Start (3 Terminals)

#### Terminal 1: Backend Server

```bash
cd ~/Desktop/JHUFall2025/Cloud/Cloud-Based-SDN-Management-Dashboard-Simulation
cd sdn_dashboard/dashboard/backend
npm start
```

**Wait for:**
```
============================================================
Server running on http://localhost:3001
Loaded state: 3 slices, 12 flows
============================================================
```

✅ Backend is ready when you see this.

---

#### Terminal 2: Frontend Dashboard

```bash
cd ~/Desktop/JHUFall2025/Cloud/Cloud-Based-SDN-Management-Dashboard-Simulation
cd sdn_dashboard/dashboard/frontend
npm start
```

**Wait for:**
```
Compiled successfully!

Local:            http://localhost:3000
```

✅ Browser opens automatically to the dashboard.

---

#### Terminal 3: OMNeT++ Simulation (Optional)

**For Demo Mode:** Skip this terminal - use pre-generated data files

**For Full Integration:**
```bash
cd ~/Desktop/JHUFall2025/Cloud/Cloud-Based-SDN-Management-Dashboard-Simulation
cd sdn_dashboard/simulations
./sdn_sim -u Cmdenv -c General
```

**Wait for:**
```
SDN Controller initializing on port 6653
Command processing enabled. Checking results/commands.json every 1 second.
```

✅ Simulation is ready for bidirectional control.

---

## Dashboard Overview

### Access Point

**URL:** http://localhost:3000

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  SDN Management Dashboard                                   │
│  [Statistics Bar: 3 slices | 12 flows | 12 hosts | 8 sw]  │
├──────────────────────────────┬──────────────────────────────┤
│                              │                              │
│   TOPOLOGY VISUALIZATION     │    SLICE MANAGEMENT PANEL    │
│        (60% width)           │       (40% width)            │
│                              │                              │
│  • 21 nodes displayed        │  • Tenant_A                  │
│  • D3.js interactive graph   │  • Tenant_B                  │
│  • Zoom & pan enabled        │  • Tenant_C                  │
│  • Color-coded by slice      │                              │
│                              │  [+ Create Slice]            │
│                              │                              │
│                              ├──────────────────────────────┤
│                              │                              │
│                              │   FLOW RULES PANEL           │
│                              │                              │
│                              │  • Flow table display        │
│                              │  • Filtered by slice         │
│                              │  • Add/Delete flows          │
│                              │                              │
│                              │  [+ Add Flow]                │
└──────────────────────────────┴──────────────────────────────┘
```

---

### Initial State

When you first open the dashboard, you should see:

**Statistics (Top Bar):**
- Slices: **3**
- Flows: **12**
- Hosts: **12**
- Switches: **8**

**Slices (Right Panel):**
- **Tenant_A** - VLAN 10, 100 Mbps, 4 hosts
- **Tenant_B** - VLAN 20, 200 Mbps, 4 hosts
- **Tenant_C** - VLAN 30, 150 Mbps, 4 hosts

**Topology (Left Panel):**
- 1 red controller node (top)
- 8 teal switch nodes (middle tiers)
- 12 colored host nodes (bottom, grouped by slice)

---

## Managing Network Slices

### What is a Network Slice?

A **network slice** is a virtual network that provides isolated connectivity for a specific tenant or application. Each slice has:

- **Name** - Identifier (e.g., "Production", "Testing")
- **VLAN ID** - Virtual LAN tag for isolation (10, 20, 30, etc.)
- **Bandwidth** - Allocated capacity in Mbps
- **Hosts** - IP addresses of hosts in this slice
- **Isolation** - Whether traffic is contained within slice

---

### View Existing Slices

1. **Look at the Slice Panel** (right side of dashboard)
2. You'll see cards for each slice with:
   - Slice name (e.g., "Tenant_A")
   - VLAN ID
   - Bandwidth allocation
   - Number of hosts
   - Isolated status (Yes/No)

---

### Create a New Slice

#### Step 1: Click "+ Create Slice" Button

Located at the top of the Slice Panel.

---

#### Step 2: Fill Out the Form

**Example: Creating a Production Slice**

```
Name:        Production_Env
VLAN ID:     40
Bandwidth:   250     (Mbps)
Hosts:       10.0.40.1, 10.0.40.2, 10.0.40.3
Isolated:    ☑ (checked)
```

**Field Descriptions:**

- **Name:** Any descriptive name (no spaces recommended)
- **VLAN ID:** Unique number (1-4094), avoid duplicates
- **Bandwidth:** Amount in Mbps to allocate (e.g., 100, 250, 500)
- **Hosts:** Comma-separated IP addresses (e.g., "10.0.40.1, 10.0.40.2")
- **Isolated:** Check to prevent traffic to other slices

---

#### Step 3: Click "Create" Button

**What happens:**

1. ✅ Form validates input
2. ✅ Frontend sends POST request to backend
3. ✅ Backend writes `commands.json`:
   ```json
   {
     "type": "CREATE_SLICE",
     "data": {
       "name": "Production_Env",
       "vlanId": 40,
       "bandwidth": 250,
       "hosts": ["10.0.40.1", "10.0.40.2", "10.0.40.3"],
       "isolated": true
     }
   }
   ```
4. ✅ OMNeT++ reads command (within 1 sim second)
5. ✅ OMNeT++ creates slice in simulation
6. ✅ OMNeT++ updates `controller_state.json`
7. ✅ Backend detects file change
8. ✅ Backend broadcasts WebSocket update
9. ✅ Dashboard refreshes automatically

**Result:** New slice appears in the panel! 🎉

---

#### Step 4: Verify Creation

**Check in Dashboard:**
- New slice "Production_Env" appears in slice list
- Statistics update: "4 slices" (was 3)
- Topology highlights new hosts (if they exist in simulation)

**Check in Simulation Terminal (if running):**
```
Processing command from file: results/commands.json
Executing CREATE_SLICE command
Created slice: Production_Env with 3 hosts
```

**Check State File:**
```bash
cat sdn_dashboard/simulations/results/controller_state.json | grep Production
```

You should see your new slice! ✅

---

### Select a Slice

**Click on any slice card** in the Slice Panel.

**What happens:**
- ✅ Slice card highlights (green border)
- ✅ Slice details expand showing host list
- ✅ Topology view highlights corresponding hosts
- ✅ Flow panel filters to show only flows for this slice
- ✅ "+ Add Flow" button becomes enabled

**Use case:** Select a slice before adding flow rules to it.

---

### Delete a Slice

#### Step 1: Find the slice card you want to delete

#### Step 2: Click the "×" button in top-right corner

#### Step 3: Confirm deletion (if prompted)

**What happens:**

1. ✅ Backend sends DELETE_SLICE command
2. ✅ OMNeT++ removes slice from simulation
3. ✅ All associated flow rules are deleted
4. ✅ State updates and broadcasts
5. ✅ Dashboard removes slice from display

**Result:** Slice disappears! Statistics update.

---

### Best Practices for Slices

✅ **Use descriptive names:** "Production", "Testing", "Guest_WiFi"
✅ **Plan VLAN IDs:** Keep a consistent numbering scheme (10, 20, 30...)
✅ **Realistic bandwidth:** Match actual network capacity
✅ **IP address planning:** Use /24 subnets (e.g., 10.0.10.x, 10.0.20.x)
✅ **Enable isolation:** For security-critical slices

❌ **Don't overlap VLAN IDs:** Each slice needs unique VLAN
❌ **Don't use invalid IPs:** Stick to private ranges (10.x.x.x, 192.168.x.x)

---

## Managing Flow Rules

### What is a Flow Rule?

A **flow rule** (OpenFlow rule) defines how network traffic should be handled. Each rule has:

- **Source IP** - Where traffic originates (e.g., 10.0.10.1)
- **Destination IP** - Where traffic goes (e.g., 10.0.10.2)
- **Action** - What to do (forward, drop, modify)
- **Priority** - Rule precedence (higher number = higher priority)
- **Slice ID** - Which slice this rule belongs to

---

### View Existing Flow Rules

1. **Look at the Flow Panel** (right side, bottom)
2. You'll see a table with columns:
   - **ID** - Unique identifier
   - **Source IP** - Origin host
   - **Dest IP** - Destination host (may be empty for "any")
   - **Action** - forward/drop/modify
   - **Priority** - Precedence value
   - **Packets** - Number of packets matched (if simulation running)
   - **Bytes** - Bytes transferred
   - **Actions** - Delete button

---

### Filter Flows by Slice

**Step 1:** Click on a slice in the Slice Panel

**Result:** Flow table now shows only flows belonging to that slice.

**Example:**
- Select "Tenant_A" → See 4 flows (10.0.10.1, 10.0.10.2, 10.0.10.3, 10.0.10.4)
- Select "Tenant_B" → See 4 flows (10.0.20.1, 10.0.20.2, 10.0.20.3, 10.0.20.4)

---

### Add a Flow Rule

#### Step 1: Select a Slice

Click on the slice where you want to add the flow.

**Important:** You must select a slice first! The "+ Add Flow" button is disabled until a slice is selected.

---

#### Step 2: Click "+ Add Flow" Button

Located at the top of the Flow Panel.

---

#### Step 3: Fill Out the Form

**Example: Allow communication between two hosts**

```
Source IP:        10.0.10.1
Destination IP:   10.0.10.2
Action:           forward
Priority:         150
```

**Field Descriptions:**

- **Source IP:** Origin host (must be valid IP)
- **Destination IP:** Target host (leave empty for "any destination")
- **Action:** Choose from dropdown
  - `forward` - Allow and route traffic
  - `drop` - Block traffic
  - `modify` - Transform packets (advanced)
- **Priority:** Rule precedence (1-1000, default 100)
  - Higher number = matched first
  - Use higher priority for specific rules

---

#### Step 4: Click "Add Flow" Button

**What happens:**

1. ✅ Backend writes ADD_FLOW command
2. ✅ OMNeT++ installs flow in controller flow table
3. ✅ State updates
4. ✅ Dashboard adds flow to table

**Result:** New flow appears in the flow table! 🎉

---

### Delete a Flow Rule

#### Step 1: Find the flow in the table

#### Step 2: Click "Delete" button in the Actions column

**What happens:**
1. ✅ Backend sends DELETE_FLOW command
2. ✅ OMNeT++ removes flow from flow table
3. ✅ Dashboard removes row from table

**Result:** Flow disappears immediately.

---

### Flow Rule Examples

#### Example 1: Allow Host-to-Host Communication

```
Source IP:     10.0.10.1
Dest IP:       10.0.10.2
Action:        forward
Priority:      100
```

**Effect:** Host 1 can send traffic to Host 2.

---

#### Example 2: Block Specific Host

```
Source IP:     10.0.10.3
Dest IP:       (empty - any destination)
Action:        drop
Priority:      200
```

**Effect:** Host 3 cannot send any traffic (quarantine).

---

#### Example 3: Cross-Slice Communication

```
Source IP:     10.0.10.1    (Tenant_A)
Dest IP:       10.0.20.1    (Tenant_B)
Action:        forward
Priority:      150
```

**Effect:** Breaks isolation - allows Tenant_A to talk to Tenant_B.

**Use case:** Shared services, database access across slices.

---

### Best Practices for Flow Rules

✅ **Higher priority for specific rules:** Drop rules before allow rules
✅ **Test with forward first:** Make sure connectivity works
✅ **Document purpose:** Keep track of why each rule exists
✅ **Clean up unused flows:** Delete obsolete rules

❌ **Don't create conflicting rules:** Same priority with opposite actions
❌ **Don't leave priority at 100 for everything:** Use range 50-200

---

## Topology Visualization

### Understanding the Topology View

The left panel shows your network as a hierarchical graph with **21 nodes**:

**Node Types:**
- 🔴 **Red circle (large)** - SDN Controller
- 🔵 **Teal circles (medium)** - Switches (8 total)
- 🟢 **Colored circles (small)** - Hosts (12 total, color by slice)

**Layout:**
```
                    Controller (red)
                         ▲
                         │
          ┌──────────────┼──────────────┐
          │              │              │
     Core Switch    Core Switch    ...
          │              │              │
          ▼              ▼              ▼
     Agg Switch     Agg Switch     Agg Switch
          │              │              │
          ▼              ▼              ▼
    Edge Switch    Edge Switch    Edge Switch
          │              │              │
     ┌────┼────┐    ┌────┼────┐    ┌────┼────┐
     ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼
   Host  Host Host Host Host Host Host Host Host...
  (slice 0)      (slice 1)       (slice 2)
```

---

### Interacting with Topology

#### Zoom

**Mouse wheel up** - Zoom in
**Mouse wheel down** - Zoom out

**Use case:** Get closer view of specific nodes.

---

#### Pan

**Click and drag** on empty space - Move view

**Use case:** Navigate large topologies.

---

#### Highlight Slice

**Click a slice** in the Slice Panel.

**Result:**
- Hosts belonging to that slice highlight with thick border
- Hosts in other slices fade to gray
- Selected slice's hosts show in slice color

**Example:**
- Click "Tenant_A" → Hosts 0-3 highlight in blue
- Click "Tenant_B" → Hosts 4-7 highlight in green
- Click "Tenant_C" → Hosts 8-11 highlight in yellow

---

### Topology Color Legend

| Color | Node Type | Count |
|-------|-----------|-------|
| 🔴 Red | Controller | 1 |
| 🔵 Teal | Switches | 8 |
| 🟦 Blue | Tenant_A Hosts | 4 |
| 🟩 Green | Tenant_B Hosts | 4 |
| 🟨 Yellow | Tenant_C Hosts | 4 |
| ⚫ Gray | Unselected/Other | Variable |

---

## Understanding the Simulation

### What's Actually Running?

When you run `./sdn_sim`, OMNeT++ creates a **discrete-event simulation** of your network:

#### 21 Simulated Nodes

1. **1 SDN Controller** - Your C++ controller code
2. **8 Switches** - OpenFlow-capable switches
3. **12 Hosts** - End-user devices

#### Simulated Network Traffic

- **Packets** - Actual Ethernet frames simulated
- **Delays** - Propagation delays on links
- **Queues** - Buffer management in switches
- **Protocols** - TCP/IP, UDP, Ethernet, VLAN tags

---

### Simulation Time vs Real Time

**Simulation Time:** Time inside the OMNeT++ simulation
- Controlled by event scheduler
- Can run faster or slower than real time
- Shown in state file `"timestamp": 5.0` (5 simulation seconds)

**Real Time:** Actual clock time
- How long simulation has been running
- Doesn't match simulation time

**Example:**
```
Simulation runs for 10 real seconds
Processes 100 seconds of simulated time
"Speed" = 10x real-time
```

---

### How Commands are Processed

When you create a slice in the dashboard:

```
Dashboard (React)
    ↓ HTTP POST
Backend (Node.js)
    ↓ Writes commands.json
OMNeT++ Simulation
    ↓ Reads file (every 1 sim second)
SDN Controller C++ Code
    ↓ Parses JSON
    ↓ Executes createSlice()
    ↓ Installs flow rules
    ↓ Updates state
    ↓ Writes controller_state.json
Backend
    ↓ Detects file change
    ↓ Broadcasts WebSocket
Dashboard
    ↓ Receives update
    ↓ Refreshes UI
```

**Key Point:** The slice is **created in the OMNeT++ simulation**, not just in the UI!

---

### Viewing Simulation Output

**In the simulation terminal (Terminal 3), you'll see:**

```
** Event #1234  t=10.5   Elapsed: 0.5s
Processing command from file: results/commands.json
Command content: {"type":"CREATE_SLICE"...
Executing CREATE_SLICE command
Parsed name: Production_Env
Parsed vlanId: 40
Parsed bandwidth: 250
Created slice: Production_Env with 3 hosts
Installed flow rule 13 from 10.0.40.1 to
Installed flow rule 14 from 10.0.40.2 to
Installed flow rule 15 from 10.0.40.3 to
Command processed and file cleared.
```

**This proves your command was executed in OMNeT++!** ✅

---

## Testing & Validation

### Automated Integration Tests

**Run the full test suite:**

```bash
cd ~/Desktop/JHUFall2025/Cloud/Cloud-Based-SDN-Management-Dashboard-Simulation/sdn_dashboard
./test_integration.sh
```

**What it tests:**
- All 13 REST API endpoints
- Create/delete operations
- Command file writing
- State synchronization
- WebSocket connectivity

**Expected result:** 20/20 tests pass ✅

---

### Manual Testing Scenarios

See detailed test scenarios in: [test_scenarios.md](sdn_dashboard/test_scenarios.md)

**Quick Test - Create and Delete Slice:**

1. Open dashboard
2. Click "+ Create Slice"
3. Fill: Name="Test", VLAN=50, BW=100, Hosts="10.0.50.1"
4. Click "Create"
5. **Verify:** Slice appears, stats show "4 slices"
6. Click "×" on Test slice
7. **Verify:** Slice disappears, stats show "3 slices"

**Success:** Create and delete both work! ✅

---

### Verifying Bidirectional Communication

**Test that dashboard controls simulation:**

1. **Start simulation in Terminal 3**
2. **Watch simulation output**
3. **Create slice in dashboard**
4. **Look at simulation terminal**

**You should see:**
```
Processing command from file: results/commands.json
Executing CREATE_SLICE command
Created slice: YourSliceName with X hosts
```

**This proves bidirectional control works!** 🎉

---

## Advanced Usage

### Using the REST API Directly

You can control the system via API without the dashboard.

#### Create Slice via curl

```bash
curl -X POST http://localhost:3001/api/slices \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API_Slice",
    "vlanId": 60,
    "bandwidth": 300,
    "hosts": ["10.0.60.1", "10.0.60.2"],
    "isolated": true
  }'
```

**Response:**
```json
{
  "id": 4,
  "name": "API_Slice",
  "vlanId": 60,
  "bandwidth": 300,
  "hosts": ["10.0.60.1", "10.0.60.2"],
  "isolated": true
}
```

---

#### Get All Slices

```bash
curl http://localhost:3001/api/slices | jq
```

---

#### Delete Slice

```bash
curl -X DELETE http://localhost:3001/api/slices/4
```

---

### Monitoring Real-Time Updates

**Connect to WebSocket (using browser console):**

```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  console.log('Connected to WebSocket');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data.type, data.data);
};
```

**You'll see:**
- `INITIAL_STATE` on connect
- `STATE_UPDATE` whenever slices/flows change

---

### Running Multiple Tests

**Stress test - create 10 slices:**

```bash
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/slices \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"Slice_$i\",
      \"vlanId\": $((40 + i)),
      \"bandwidth\": 100,
      \"hosts\": [\"10.0.$((40 + i)).1\"],
      \"isolated\": true
    }"
  sleep 2
done
```

**Check dashboard:** Should now show 13 slices (3 + 10)!

---

### Exporting Data

#### Export Current State

```bash
# Get all slices as JSON
curl http://localhost:3001/api/slices > slices_backup.json

# Get all flows
curl http://localhost:3001/api/flows > flows_backup.json

# Get topology
curl http://localhost:3001/api/topology > topology_backup.json
```

---

#### View OMNeT++ Results

OMNeT++ generates detailed result files:

```bash
cd sdn_dashboard/simulations/results

# Scalar results (statistics)
cat General-#0.sca

# Vector results (time series)
# Open with OMNeT++ IDE or analysis tools
```

---

## Tips & Best Practices

### Development Workflow

**Making Changes:**

1. **Backend changes:** Restart backend (Ctrl+C, npm start)
2. **Frontend changes:** Hot reload automatic (or restart)
3. **Controller changes:** Rebuild and restart simulation
   ```bash
   cd sdn_dashboard/src
   make clean && make MODE=release
   cd ../simulations
   ./sdn_sim -u Cmdenv -c General
   ```

---

### Performance Tips

✅ **Run simulation with time limit for testing:**
```bash
./sdn_sim -u Cmdenv -c General -t 60s
```

✅ **Use Cmdenv (command-line) instead of GUI:**
- Faster execution
- Better for automated testing

✅ **Close unused browser tabs:**
- WebSocket connections consume resources

---

### Debugging

**Backend not responding?**
```bash
# Check if backend is running
lsof -i :3001

# Check backend logs
# Look at Terminal 1 output

# Restart backend
cd sdn_dashboard/dashboard/backend
npm start
```

**Frontend not updating?**
```bash
# Check WebSocket connection
# Open browser console (F12)
# Look for "WebSocket connected" message

# Check for errors in console

# Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Linux)
```

**Simulation not processing commands?**
```bash
# Check simulation is running
ps aux | grep sdn_sim

# Check commands.json exists
cat sdn_dashboard/simulations/results/commands.json

# Verify controller_state.json updates
watch -n 1 'cat sdn_dashboard/simulations/results/controller_state.json | jq .timestamp'
```

---

### Common Gotchas

❌ **Forgetting to select slice before adding flow**
- Solution: Always click a slice first

❌ **Using duplicate VLAN IDs**
- Solution: Keep track of used VLANs (10, 20, 30, 40...)

❌ **Expecting instant updates with simulation off**
- Solution: Commands only execute when simulation runs

❌ **Deleting slice with active flows**
- Solution: Flows auto-delete with slice (this is OK)

---

### Keyboard Shortcuts

**Dashboard:**
- `Cmd/Ctrl + R` - Refresh page
- `Cmd/Ctrl + Shift + R` - Hard refresh (clear cache)
- `F12` - Open browser developer tools
- `Cmd/Ctrl + +/-` - Zoom in/out

**Terminal:**
- `Ctrl + C` - Stop running process
- `Ctrl + L` - Clear terminal
- `Ctrl + R` - Search command history

---

## Summary

### Basic Workflow

1. **Start backend and frontend** (always required)
2. **Start simulation** (optional, for bidirectional control)
3. **Access dashboard** at http://localhost:3000
4. **Create slices** to define virtual networks
5. **Add flows** to control traffic between hosts
6. **Visualize** topology and monitor statistics
7. **Test** with integration tests or manual scenarios

---

### Key Concepts

- **Slices** = Virtual networks with isolation
- **Flows** = OpenFlow rules defining traffic behavior
- **OMNeT++** = Network simulator running your SDN controller
- **Bidirectional** = Dashboard controls simulation, simulation updates dashboard

---

## Next Steps

- **Explore Advanced Features:** Try cross-slice flows, complex topologies
- **Read Test Scenarios:** [test_scenarios.md](sdn_dashboard/test_scenarios.md)
- **Study Implementation:** [implementation.md](implementation.md)
- **Modify Code:** Extend controller with new features

---

**Questions?**
- Setup issues: [SETUP.md](SETUP.md)
- System docs: [README.md](sdn_dashboard/README.md)
- Phase 6 details: [PHASE6_COMPLETE.md](PHASE6_COMPLETE.md)

**Happy SDN Management!** 🎉🌐
