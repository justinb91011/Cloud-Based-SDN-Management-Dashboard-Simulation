# Phase 8 Quick Start Guide

## Quick Setup (5 minutes)

### 1. Start the Backend (Terminal 1)
```bash
cd sdn_dashboard/dashboard/backend
npm install  # if not already done
node server.js
```

**Expected output:**
```
====================================================================
SDN Dashboard Backend Server
====================================================================
Server running on http://localhost:3001
...
Available endpoints:
  GET  /api/metrics
  GET  /api/metrics/recent
  ...
====================================================================
```

### 2. Start the Frontend (Terminal 2)
```bash
cd sdn_dashboard/dashboard/frontend
npm install  # if not already done
npm start
```

**Expected output:**
```
Compiled successfully!

You can now view sdn-dashboard in the browser.

  Local:            http://localhost:3000
```

### 3. Run Basic Tests (Terminal 3)
```bash
cd sdn_dashboard
./test-phase8.sh
```

**Expected output:**
```
=================================================================
Phase 8 Testing - Performance Metrics & Advanced Features
=================================================================

✓ Backend is running
✓ Frontend is running

Test: Backend Health Check
-------------------------------------------------------------------
✓ PASSED

Test: Metrics Endpoint Available
-------------------------------------------------------------------
✓ PASSED

...

Total Tests: 10
Passed: 10
Failed: 0

✓ All tests passed!
```

### 4. View the Dashboard
Open http://localhost:3000 in your browser.

**What to look for:**
1. Dashboard loads with topology view
2. Scroll to bottom - see **Performance Metrics** section
3. See 5 metric cards:
   - Avg API Response Time
   - Avg WebSocket Latency
   - Slice Operations
   - Flow Operations
   - System Memory

## Quick Feature Tour (10 minutes)

### Test the Metrics Dashboard

#### Step 1: Create Some Data
1. In the dashboard, create a new slice:
   - Name: "TestSlice"
   - VLAN ID: 100
   - Bandwidth: 1000
   - Hosts: 10.0.1.1, 10.0.1.2
   - Click "Create Slice"

2. Create a flow:
   - Source IP: 10.0.1.1
   - Destination IP: 10.0.1.2
   - Action: ALLOW
   - Priority: 100
   - Click "Add Flow"

#### Step 2: Watch Metrics Update
1. Scroll to Performance Metrics section
2. Observe the numbers updating (auto-refresh every 5 seconds)
3. See operation counts increase

#### Step 3: Explore Detailed Views
1. Click on "Slice Operations" card
2. See detailed table with:
   - Operation type (create/delete/update)
   - Slice ID
   - Duration in milliseconds
   - Success status (✓ or ✗)
   - Timestamp
3. Click "Close" to return

4. Click on "API Response Times" card
5. See list of recent API calls with durations
6. Click "Close"

#### Step 4: Test Auto-Refresh
1. Uncheck "Auto-refresh (5s)" checkbox
2. Create another slice
3. Metrics don't update automatically
4. Click "Refresh Now" button
5. Metrics update immediately
6. Re-enable auto-refresh

### Run Advanced Stress Test

```bash
cd sdn_dashboard
./test-advanced-scenarios.sh
```

This will:
- Create 10 slices rapidly
- Delete them all
- Test VLAN conflicts
- Create 20 flows concurrently
- Test bandwidth reallocation
- Create 3 tenant slices
- Benchmark all API endpoints

**Watch the metrics dashboard while this runs!**

### Compile Test Results

After running tests:

```bash
python3 compile-test-logs.py
```

This creates:
- `test-compilation-report.json` - machine-readable results
- `test-compilation-report.html` - visual report

**Open the HTML report:**
```bash
# macOS
open test-compilation-report.html

# Linux
xdg-open test-compilation-report.html

# Windows
start test-compilation-report.html
```

## Common Tasks

### Check Current Metrics via API
```bash
curl http://localhost:3001/api/metrics | python3 -m json.tool
```

### Get Recent Metrics (last 20)
```bash
curl "http://localhost:3001/api/metrics/recent?count=20" | python3 -m json.tool
```

### Check Server Health
```bash
curl http://localhost:3001/api/health | python3 -m json.tool
```

### Check WebSocket Status
```bash
curl http://localhost:3001/api/status | python3 -m json.tool
```

### View Metrics File Directly
```bash
cat simulations/results/performance_metrics.json | python3 -m json.tool
```

## Understanding the Metrics

### API Response Time
- **What it measures:** How long API endpoints take to respond
- **Good range:** 10-100ms
- **Red flag:** > 500ms consistently

### WebSocket Latency
- **What it measures:** Round-trip time for real-time updates
- **Good range:** 5-50ms
- **Red flag:** > 200ms

### Slice Operations
- **What it tracks:** Create, update, delete operations
- **Success rate target:** 100%
- **If < 100%:** Check error logs

### Flow Operations
- **What it tracks:** Flow add/delete operations
- **Success rate target:** 100%
- **If < 100%:** Check validation logic

### System Memory
- **What it shows:** Node.js heap usage
- **Typical range:** 40-100 MB
- **Red flag:** Continually increasing (memory leak)

## Troubleshooting

### "Backend is not running"
```bash
# Check if port 3001 is in use
lsof -i :3001

# Start backend
cd sdn_dashboard/dashboard/backend
node server.js
```

### "Metrics show 0 operations"
- Create some slices and flows first
- Wait 5 seconds for auto-refresh
- Click "Refresh Now"

### "Auto-refresh not working"
- Check browser console (F12) for errors
- Verify backend WebSocket is connected (connection status indicator)
- Reload the page

### "Test script fails"
```bash
# Make sure script is executable
chmod +x test-phase8.sh
chmod +x test-advanced-scenarios.sh

# Check curl is installed
which curl

# Verify backend is running
curl http://localhost:3001/api/health
```

### "Python script fails"
```bash
# Check Python version (needs 3.6+)
python3 --version

# Run with explicit path
python3 ./compile-test-logs.py
```

## File Locations

### Backend Files
- **Server:** `sdn_dashboard/dashboard/backend/server.js`
- **Metrics Collector:** `sdn_dashboard/dashboard/backend/metricsCollector.js`
- **Metrics Data:** `sdn_dashboard/simulations/results/performance_metrics.json`

### Frontend Files
- **Main App:** `sdn_dashboard/dashboard/frontend/src/App.js`
- **Metrics Component:** `sdn_dashboard/dashboard/frontend/src/components/PerformanceMetrics.js`
- **Metrics Styles:** `sdn_dashboard/dashboard/frontend/src/components/PerformanceMetrics.css`

### Test Files
- **Basic Tests:** `sdn_dashboard/test-phase8.sh`
- **Stress Tests:** `sdn_dashboard/test-advanced-scenarios.sh`
- **Log Compiler:** `sdn_dashboard/compile-test-logs.py`
- **Test Results:** `sdn_dashboard/test-results-phase8-*.log`

## Next Steps

1. **Review Phase 8 Documentation:**
   ```bash
   cat PHASE8-COMPLETE.md
   ```

2. **Run Full Test Suite:**
   ```bash
   ./test-phase8.sh
   ./test-advanced-scenarios.sh
   python3 compile-test-logs.py
   ```

3. **Explore Metrics Data:**
   - Open browser dev tools (F12)
   - Go to Network tab
   - Watch API calls to /api/metrics
   - See real-time data updates

4. **Experiment with Load:**
   - Run stress tests multiple times
   - Watch metrics change
   - Observe performance patterns

5. **Generate Reports:**
   - Compile test logs to HTML
   - Share with team/instructor
   - Document performance characteristics

## Success Criteria

You've successfully completed Phase 8 when you can:

✓ Start backend and frontend without errors
✓ See Performance Metrics section in dashboard
✓ All 5 metric cards show data
✓ Click cards to see detailed views
✓ Auto-refresh updates metrics every 5 seconds
✓ Run test-phase8.sh with all tests passing
✓ Run advanced stress tests successfully
✓ Generate and view HTML test report
✓ Understand what each metric measures

## Getting Help

If you encounter issues:
1. Check this guide's Troubleshooting section
2. Review PHASE8-COMPLETE.md for details
3. Check browser console (F12) for errors
4. Check backend terminal for error messages
5. Verify all npm packages installed
6. Ensure ports 3000 and 3001 are available

## Time Estimates

- **Initial Setup:** 5 minutes
- **Feature Tour:** 10 minutes
- **Running Tests:** 5 minutes
- **Exploring Reports:** 5 minutes
- **Total:** ~25 minutes

Enjoy exploring Phase 8! 🚀
