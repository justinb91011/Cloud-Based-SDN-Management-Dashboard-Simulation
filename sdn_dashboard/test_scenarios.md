# Test Scenarios for Milestone 1 - Phase 6 Integration

**Project:** Cloud-Based SDN Management Dashboard
**Phase:** 6 - Integration and Testing
**Document Version:** 1.0
**Date:** November 5, 2025

---

## Overview

This document describes comprehensive test scenarios for validating the complete SDN Dashboard system, including bidirectional communication between the web dashboard, backend server, and OMNeT++ simulation.

## Test Environment Setup

### Prerequisites
- OMNeT++ simulation running (optional for basic backend tests)
- Backend server running on port 3001
- Frontend dashboard accessible on port 3000
- Initial state: 3 default slices (Tenant_A, Tenant_B, Tenant_C)

### Starting the System

#### Terminal 1: Backend Server
```bash
cd sdn_dashboard/dashboard/backend
npm start
```

#### Terminal 2: Frontend Dashboard (Optional for manual testing)
```bash
cd sdn_dashboard/dashboard/frontend
npm start
```

#### Terminal 3: OMNeT++ Simulation (Optional - for full integration)
```bash
cd sdn_dashboard/simulations
./sdn_sim -u Cmdenv -c General
```

---

## Scenario 1: Basic Slice Management

### Objective
Verify end-to-end slice creation, viewing, and deletion functionality.

### Steps

#### 1.1 View Initial State
**Action:** Access dashboard at http://localhost:3000
**Expected Result:**
- Dashboard loads successfully
- Topology visualization displays 21 nodes
- Right panel shows 3 existing slices: Tenant_A, Tenant_B, Tenant_C
- Statistics show: 3 slices, 12 flows, 12 hosts, 8 switches

#### 1.2 Create New Slice via Dashboard
**Action:**
1. Click "+ Create Slice" button
2. Fill form:
   - Name: "TestSlice_A"
   - VLAN ID: 40
   - Bandwidth: 150 Mbps
   - Hosts: "10.0.40.1, 10.0.40.2, 10.0.40.3"
   - Isolated: ✓ (checked)
3. Click "Create" button

**Expected Result:**
- Form closes
- New slice "TestSlice_A" appears in slice list
- Backend writes command to `results/commands.json`:
  ```json
  {
    "type": "CREATE_SLICE",
    "data": {
      "name": "TestSlice_A",
      "vlanId": 40,
      "bandwidth": 150,
      "hosts": ["10.0.40.1", "10.0.40.2", "10.0.40.3"],
      "isolated": true
    },
    "timestamp": 1699200000000
  }
  ```
- If simulation running: OMNeT++ processes command and updates `controller_state.json`
- Statistics update: 4 slices total

#### 1.3 Select Slice
**Action:** Click on "TestSlice_A" in the slice panel

**Expected Result:**
- Slice card highlights with green border
- Slice details expand showing host list
- Topology view highlights corresponding hosts in distinct color
- Flow panel filters to show flows for this slice

#### 1.4 View Slice Details
**Action:** Observe expanded slice card

**Expected Result:**
- VLAN: 40
- Bandwidth: 150 Mbps
- Hosts: 3
- Isolated: Yes
- Host list shows: 10.0.40.1, 10.0.40.2, 10.0.40.3

#### 1.5 Delete Slice
**Action:**
1. Click "×" button on TestSlice_A card
2. (Optional) Confirm deletion if prompted

**Expected Result:**
- Slice removed from slice list
- Backend writes DELETE_SLICE command to commands.json
- If simulation running: Associated flows removed
- Statistics update: Back to 3 slices
- Topology unhighlights hosts

### Success Criteria
- ✓ All slices visible in panel
- ✓ New slice created successfully
- ✓ Slice appears in backend data
- ✓ Command file written correctly
- ✓ Slice selection highlights hosts
- ✓ Slice deletion removes data
- ✓ Real-time updates via WebSocket

---

## Scenario 2: Flow Rule Management

### Objective
Verify dynamic flow provisioning: creating and deleting OpenFlow rules interactively.

### Steps

#### 2.1 Select Target Slice
**Action:** Click on "Tenant_A" slice in the slice panel

**Expected Result:**
- Tenant_A highlighted
- Flow panel shows existing 4 flows for Tenant_A
- "+ Add Flow" button is enabled

#### 2.2 View Existing Flows
**Action:** Scroll through flow table

**Expected Result:**
- Table displays flows with columns: ID, Source IP, Dest IP, Action, Priority, Packets, Bytes, Actions
- Each row shows a flow rule
- Statistics (packets, bytes) visible (may be 0)

#### 2.3 Add New Flow Rule
**Action:**
1. Click "+ Add Flow" button
2. Fill form:
   - Source IP: "10.0.10.1"
   - Destination IP: "10.0.10.2"
   - Action: "forward" (dropdown)
   - Priority: 150
3. Click "Add Flow" button

**Expected Result:**
- Form closes
- New flow appears in flow table
- Backend writes ADD_FLOW command:
  ```json
  {
    "type": "ADD_FLOW",
    "data": {
      "srcIP": "10.0.10.1",
      "dstIP": "10.0.10.2",
      "action": "forward",
      "priority": 150,
      "sliceId": 1
    },
    "timestamp": 1699200000000
  }
  ```
- If simulation running: Flow installed in controller flowTable
- Flow table updates showing new flow with ID

#### 2.4 Check Flow Statistics
**Action:** Observe flow table after traffic (if simulation running)

**Expected Result:**
- Packets column increments (if traffic generated)
- Bytes column increments
- Statistics update in real-time

#### 2.5 Delete Flow Rule
**Action:**
1. Locate newly created flow in table
2. Click "Delete" button in Actions column

**Expected Result:**
- Flow removed from table
- Backend writes DELETE_FLOW command
- If simulation running: Flow removed from controller
- Flow count decrements

### Success Criteria
- ✓ Flows filtered by selected slice
- ✓ New flow added successfully
- ✓ Flow appears in backend data
- ✓ Command file written correctly
- ✓ Flow statistics visible (if simulation running)
- ✓ Flow deletion works correctly

---

## Scenario 3: Slice Isolation Testing

### Objective
Verify that network slices are properly isolated and traffic containment works.

### Prerequisites
- OMNeT++ simulation running with traffic generation
- All 3 default slices active

### Steps

#### 3.1 Monitor Tenant_A Traffic
**Action:**
1. Select Tenant_A slice
2. Observe flow table statistics

**Expected Result:**
- Packets show traffic between 10.0.10.x hosts only
- No cross-slice communication visible
- All flows have sliceId = 1

#### 3.2 Monitor Tenant_B Traffic
**Action:**
1. Select Tenant_B slice
2. Observe flow table statistics

**Expected Result:**
- Packets show traffic between 10.0.20.x hosts only
- Separate from Tenant_A traffic
- All flows have sliceId = 2

#### 3.3 Create Cross-Slice Flow (Break Isolation)
**Action:**
1. Select Tenant_A
2. Add flow:
   - Source IP: "10.0.10.1"
   - Destination IP: "10.0.20.1" (Tenant_B host)
   - Action: "forward"
   - Priority: 200

**Expected Result:**
- Flow created
- Traffic can now flow from Tenant_A to Tenant_B (if simulation running)
- Demonstrates operator control over isolation

#### 3.4 Verify Isolation Restored
**Action:** Delete the cross-slice flow created in 3.3

**Expected Result:**
- Slices return to isolated state
- Traffic contained within slices again

### Success Criteria
- ✓ Slices are isolated by default
- ✓ Traffic statistics show only intra-slice communication
- ✓ Manual flow rules can enable inter-slice communication
- ✓ Isolation can be restored by removing flows

---

## Scenario 4: Real-Time Synchronization

### Objective
Verify WebSocket-based real-time updates between backend and frontend.

### Steps

#### 4.1 Establish WebSocket Connection
**Action:** Open dashboard in browser

**Expected Result:**
- Browser console shows "WebSocket connected" (check DevTools)
- Initial state received via INITIAL_STATE message
- Dashboard displays current data

#### 4.2 Create Resource via API
**Action:** In terminal, run:
```bash
curl -X POST http://localhost:3001/api/slices \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API_Created_Slice",
    "vlanId": 50,
    "bandwidth": 200,
    "hosts": ["10.0.50.1"],
    "isolated": true
  }'
```

**Expected Result:**
- API returns 201 Created
- Backend broadcasts STATE_UPDATE via WebSocket
- Dashboard automatically updates WITHOUT page refresh
- New slice "API_Created_Slice" appears in slice panel
- Statistics increment

#### 4.3 Delete Resource via API
**Action:** Run:
```bash
curl -X DELETE http://localhost:3001/api/slices/4
```

**Expected Result:**
- API returns 200 OK
- WebSocket broadcasts update
- Slice disappears from dashboard automatically
- Statistics decrement

#### 4.4 Modify State File Directly (If Simulation Running)
**Action:**
1. Edit `results/controller_state.json` manually
2. Add/modify a slice or flow
3. Save file

**Expected Result:**
- Backend file watcher detects change
- Backend reloads state
- WebSocket broadcasts STATE_UPDATE
- Dashboard updates automatically

### Success Criteria
- ✓ WebSocket connection established
- ✓ Dashboard receives INITIAL_STATE
- ✓ STATE_UPDATE messages broadcast correctly
- ✓ Dashboard updates without manual refresh
- ✓ File watcher triggers updates

---

## Scenario 5: Topology Visualization

### Objective
Verify network topology visualization displays correctly and is interactive.

### Steps

#### 5.1 View Complete Topology
**Action:** Access dashboard and observe topology view

**Expected Result:**
- SVG canvas displays in left panel
- 21 nodes rendered:
  - 1 controller (red circle, large)
  - 8 switches (teal circles, medium)
  - 12 hosts (colored by slice, small)
- Nodes arranged in hierarchical layout:
  - Controller at top
  - Switches in middle tiers
  - Hosts at bottom
- Node labels visible

#### 5.2 Identify Node Types
**Action:** Observe node colors and sizes

**Expected Result:**
- Controller: Red, larger radius
- Switches: Teal, medium radius
- Hosts: Different colors per slice, smaller radius
- Color legend implicit (by slice selection)

#### 5.3 Interact with Topology
**Action:**
1. Use mouse wheel to zoom in/out
2. Click and drag to pan
3. Select different slices

**Expected Result:**
- Zoom works smoothly
- Pan navigation functional
- Selected slice's hosts highlight with thicker border
- Non-selected hosts gray out

#### 5.4 Verify Slice Highlighting
**Action:** Click each slice (Tenant_A, B, C) in sequence

**Expected Result:**
- Hosts 0-3 highlight for Tenant_A
- Hosts 4-7 highlight for Tenant_B
- Hosts 8-11 highlight for Tenant_C
- Selected hosts have colored fill + thick border
- Topology updates immediately on selection

### Success Criteria
- ✓ Topology displays all 21 nodes
- ✓ Node types distinguishable by color/size
- ✓ Hierarchical layout clear
- ✓ Zoom and pan work
- ✓ Slice selection highlights hosts
- ✓ Visual feedback is immediate

---

## Scenario 6: Error Handling and Edge Cases

### Objective
Verify system handles invalid inputs and error conditions gracefully.

### Steps

#### 6.1 Create Slice with Missing Fields
**Action:**
1. Click "+ Create Slice"
2. Fill only Name: "Incomplete"
3. Leave other fields empty
4. Click "Create"

**Expected Result:**
- Form validation error
- Backend returns 400 Bad Request
- Error message displayed to user
- Slice not created

#### 6.2 Delete Non-Existent Resource
**Action:** Run:
```bash
curl -X DELETE http://localhost:3001/api/slices/999
```

**Expected Result:**
- API returns 404 Not Found
- Error message: "Slice not found"
- No state change

#### 6.3 Add Flow Without Selecting Slice
**Action:**
1. Deselect all slices
2. Try to click "+ Add Flow"

**Expected Result:**
- Button is disabled (grayed out)
- Cannot add flow without slice context
- User feedback: "Select a slice first"

#### 6.4 Invalid IP Address
**Action:** Create flow with srcIP: "invalid"

**Expected Result:**
- Validation error (if frontend has validation)
- Or backend handles gracefully without crash
- Flow not created

### Success Criteria
- ✓ Form validation works
- ✓ API errors handled properly
- ✓ User receives clear error messages
- ✓ System doesn't crash on invalid input
- ✓ State remains consistent

---

## Performance Tests

### Test 1: Handle Multiple Slices

**Objective:** Verify system can handle 10 slices without degradation.

**Steps:**
1. Create 10 slices via API (loop)
2. Observe dashboard performance

**Expected Results:**
- All 10 slices display
- Topology still renders smoothly
- Slice panel scrollable
- No UI lag

**Acceptance:** System handles 10 slices with <500ms response time

---

### Test 2: Handle 100 Flow Rules

**Objective:** Verify flow table performance with large dataset.

**Steps:**
1. Create 100 flows via API
2. View flow table

**Expected Results:**
- All flows display in table
- Scrolling is smooth
- Filtering by slice works
- Table renders in <2 seconds

**Acceptance:** System handles 100 flows without UI freeze

---

### Test 3: Rapid Updates

**Objective:** Test real-time update handling under rapid changes.

**Steps:**
1. Create 10 slices rapidly (1 per second)
2. Delete 5 slices
3. Create 10 flows rapidly

**Expected Results:**
- Dashboard stays synchronized
- No missed updates
- No race conditions
- WebSocket handles message queue
- UI updates smoothly

**Acceptance:** All operations complete successfully, no data loss

---

## Automation Testing

### Automated Test Script

Run the integration test suite:

```bash
cd sdn_dashboard
./test_integration.sh
```

**Expected Output:**
- All 20 tests pass
- Green checkmarks for each test
- Test summary shows 100% pass rate
- Results saved to test_results.txt

---

## Regression Testing Checklist

Use this checklist after any code changes:

### Backend
- [ ] Health endpoint responds
- [ ] All 13 REST endpoints work
- [ ] WebSocket server accepts connections
- [ ] File watcher detects changes
- [ ] Command files written correctly
- [ ] CORS configured properly
- [ ] Error handling works

### Frontend
- [ ] Application builds successfully
- [ ] Dashboard loads in browser
- [ ] Topology visualization displays
- [ ] All components render
- [ ] Forms work and validate
- [ ] WebSocket connects
- [ ] Real-time updates work

### Integration
- [ ] Dashboard connects to backend
- [ ] Backend reads simulation state
- [ ] Commands from dashboard reach simulation
- [ ] State changes propagate to dashboard
- [ ] All CRUD operations work
- [ ] Bidirectional sync operational

### Simulation (If Running)
- [ ] Controller initializes
- [ ] State file exports
- [ ] Topology file exports
- [ ] Command file read
- [ ] Commands executed
- [ ] State updates after commands

---

## Known Limitations and Future Tests

### Current Limitations
1. Command processing requires simulation running for full integration
2. No persistence beyond JSON files
3. Single user support only
4. Limited error recovery

### Future Test Scenarios
1. Multi-user concurrent access
2. Database persistence testing
3. Authentication and authorization
4. Advanced ACL rule testing
5. Performance under network delays
6. Fault tolerance (server restart)
7. Load testing (1000+ resources)

---

## Troubleshooting Test Failures

### Backend Not Responding
- Check if server is running: `ps aux | grep node`
- Check port 3001: `lsof -i :3001`
- Review backend logs
- Restart backend server

### Dashboard Not Loading
- Check if frontend is running: `ps aux | grep react`
- Check port 3000: `lsof -i :3000`
- Clear browser cache
- Check browser console for errors

### State Not Updating
- Verify state files exist: `ls -la sdn_dashboard/simulations/results/`
- Check file permissions
- Verify file watcher is active (check backend logs)
- Restart backend to reload state

### Commands Not Executed
- Check if simulation is running
- Verify command file exists and has content
- Check simulation logs (OMNeT++ output)
- Ensure command processor is enabled in controller

---

## Conclusion

These test scenarios provide comprehensive coverage of the SDN Dashboard system functionality. Successfully passing all scenarios validates that Phase 6 integration is complete and the system is production-ready for Milestone 1.

**Success Criteria for Phase 6:**
- All 5 manual scenarios pass ✓
- All 3 performance tests meet criteria ✓
- Automated test script: 20/20 tests pass ✓
- Regression checklist: All items checked ✓

When all criteria are met, Phase 6 is **COMPLETE**.
