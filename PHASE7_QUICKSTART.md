# Phase 7 Quick Start Guide

## 🚀 Running the Dashboard with Phase 7 Features

### Prerequisites
- Node.js installed
- Backend and frontend dependencies installed
- OMNeT++ simulation running (optional for full testing)

---

## Step 1: Start the Backend

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
API available at http://localhost:3001/api
WebSocket available at ws://localhost:3001
------------------------------------------------------------
Loading simulation data...
============================================================

Available endpoints:
  GET  /api/health
  GET  /api/status         # 🆕 NEW in Phase 7
  GET  /api/topology
  GET  /api/slices
  ...
```

---

## Step 2: Start the Frontend

In a **new terminal**:

```bash
cd sdn_dashboard/dashboard/frontend
npm start
```

The dashboard will open at: `http://localhost:3000`

---

## 🎯 Testing Phase 7 Features

### Feature 1: Connection Status Indicator

**What to Look For:**
- Green pulsing dot in the header = Connected
- Red dot = Disconnected
- Orange dot = Reconnecting
- "Last update" timestamp

**How to Test:**
1. Open dashboard - should show green "Connected"
2. Stop backend server - should show red "Disconnected" and "Reconnecting..."
3. Restart backend - should reconnect automatically and show green

---

### Feature 2: Auto-Reconnect

**How to Test:**
1. Open browser console (F12)
2. Watch for "WebSocket connected" message
3. Stop backend server
4. See "WebSocket disconnected" and "Attempting to reconnect..."
5. Restart backend within 3 seconds
6. See automatic reconnection without page refresh

---

### Feature 3: Per-Slice ACL Editing

**How to Test:**
1. Click on any network slice in the slice panel
2. Scroll down to see "ACL Rules" section
3. Click "Edit ACL" button
4. Fill in ACL rule form:
   - Source IP: `10.0.10.1`
   - Destination IP: `10.0.10.2`
   - Protocol: `TCP`
   - Action: `Allow`
5. Click "Add Rule"
6. See rule appear with green "ALLOW" badge
7. Add deny rule and see red "DENY" badge
8. Click × to delete a rule

---

### Feature 4: Segmented Topology View

**How to Test:**
1. Select a network slice by clicking it
2. Look for "Full View" / "Slice View" toggle buttons above topology
3. Click "Slice View"
4. See:
   - Only selected slice's hosts visible
   - Dashed boundary box around slice hosts
   - Slice name label on boundary
   - Compact host layout
5. Click "Full View" to see entire topology again

---

### Feature 5: Heartbeat Mechanism

**How to Test in Browser Console:**
1. Open browser console (F12)
2. Watch for heartbeat messages every 10 seconds
3. Network tab will show WebSocket frames
4. Look for `type: "HEARTBEAT"` messages

**Test via API:**
```bash
curl http://localhost:3001/api/status
```

**Expected Response:**
```json
{
  "server": "running",
  "websocket": {
    "connected": true,
    "clients": 1,
    "lastHeartbeat": 1699200000000
  },
  "simulation": {
    "stateFileExists": true,
    "lastUpdate": 0
  }
}
```

---

## 🧪 Automated Testing

### Run Phase 7 Test Suite:

```bash
cd sdn_dashboard/dashboard
./test-phase7.sh
```

**Tests Include:**
1. Backend health check
2. WebSocket status endpoint
3. Slice creation with ACL
4. ACL rule updates
5. Connection state tracking
6. Heartbeat mechanism
7. Slice retrieval
8. ACL data verification
9. Cleanup operations
10. Client tracking

**Expected Output:**
```
==========================================
Phase 7 Feature Testing
==========================================

✓ PASS: Backend server is healthy
✓ PASS: Status endpoint returns WebSocket info
✓ PASS: Slice created with ACL support
...

==========================================
Test Summary
==========================================
Tests Passed: 10
Tests Failed: 0
Total Tests:  10

All Phase 7 tests passed!
```

---

## 🔍 Manual Testing Scenarios

### Scenario 1: Connection Recovery
1. Start backend and frontend
2. Create a slice
3. Stop backend
4. Add ACL rule (will fail, shows error)
5. Restart backend
6. Wait for auto-reconnect (3 seconds)
7. Try adding ACL rule again - should work

### Scenario 2: Multi-Slice ACL Management
1. Create 3 slices
2. Select Slice 1, add 2 allow rules
3. Select Slice 2, add 1 deny rule
4. Select Slice 3, add 3 rules (mixed)
5. Switch between slices - ACLs should be slice-specific
6. Refresh page - ACLs should persist

### Scenario 3: Topology View Switching
1. Create multiple slices with hosts
2. Select Slice 1
3. Switch to Slice View - see only Slice 1 hosts
4. Select Slice 2
5. See topology update to show Slice 2 hosts
6. Switch to Full View - see all hosts
7. Try Slice View with no slice selected - button disabled

---

## 🐛 Troubleshooting

### Issue: "Connection Status shows Disconnected"
**Solution:**
- Check backend is running on port 3001
- Check for port conflicts
- Look at browser console for WebSocket errors

### Issue: "ACL rules not saving"
**Solution:**
- Check backend server logs
- Ensure slice is selected before adding rules
- Verify network requests in browser DevTools

### Issue: "Slice View button disabled"
**Solution:**
- Select a slice first by clicking it
- Button is intentionally disabled when no slice selected

### Issue: "Heartbeat not working"
**Solution:**
- Check `/api/status` endpoint
- Look for WebSocket connection in browser DevTools
- Check backend console for heartbeat logs

---

## 📊 Performance Indicators

**Good Connection Health:**
- Connection Status: Green
- Last Update: < 15 seconds ago
- WebSocket clients: ≥ 1
- Last Heartbeat: Recent timestamp

**Check via API:**
```bash
# Should return healthy status
curl http://localhost:3001/api/status | json_pp
```

---

## 🎓 Feature Summary

| Feature | Status | Location |
|---------|--------|----------|
| Push Notifications | ✅ | Backend WebSocket |
| Auto-Reconnect | ✅ | Frontend App.js |
| Connection Status | ✅ | Header Component |
| ACL Editing | ✅ | Slice Panel |
| Topology Segmentation | ✅ | Topology View |
| Heartbeat | ✅ | Backend + Frontend |
| Status Endpoint | ✅ | `/api/status` |

---

## 📖 Related Documentation

- Full implementation details: [implementation.md](../implementation.md)
- Phase 7 completion: [PHASE7_COMPLETE.md](./PHASE7_COMPLETE.md)
- Integration tests: [test-phase7.sh](./dashboard/test-phase7.sh)
- Project README: [README.md](./README.md)

---

**Happy Testing! 🎉**

All Phase 7 features are fully functional and ready for demonstration.
