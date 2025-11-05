# Quick Start Guide - SDN Management Dashboard

## Prerequisites
- OMNeT++ 6.0 installed
- Node.js installed
- Git (for cloning)

## Installation (One-time Setup)

### 1. Install Backend Dependencies
```bash
cd sdn_dashboard/dashboard/backend
npm install
```

### 2. Install Frontend Dependencies
```bash
cd sdn_dashboard/dashboard/frontend
npm install
```

## Running the Dashboard

### Method 1: Full Stack (Recommended)

Open 2 terminal windows:

**Terminal 1 - Backend:**
```bash
cd sdn_dashboard/dashboard/backend
npm start
```
Wait for: `Server running on http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd sdn_dashboard/dashboard/frontend
npm start
```
Wait for: `Compiled successfully!`

Browser automatically opens to: **http://localhost:3000**

### Method 2: Development Mode

If you have `tmux` or `screen`:

```bash
# Backend in background
cd sdn_dashboard/dashboard/backend && npm start &

# Frontend in background (opens browser)
cd sdn_dashboard/dashboard/frontend && npm start &
```

## Accessing the Dashboard

Once both servers are running:

- **Dashboard UI:** http://localhost:3000
- **Backend API:** http://localhost:3001/api
- **Health Check:** http://localhost:3001/api/health

## Using the Dashboard

### View Network Topology
- Topology is displayed automatically on the left
- Shows 21 nodes (1 controller, 8 switches, 12 hosts)
- Use mouse to zoom and pan

### Manage Network Slices
1. View existing slices in right panel (Tenant_A, Tenant_B, Tenant_C)
2. Click a slice to select it (highlights hosts in topology)
3. Create new slice: Click "+ Create Slice", fill form, submit
4. Delete slice: Click "×" on slice card, confirm

### Manage Flow Rules
1. Select a slice first (required)
2. View flows in bottom panel (filtered by selected slice)
3. Add flow: Click "+ Add Flow", fill form, submit
4. Delete flow: Click "Delete" in table row, confirm

### View Statistics
- Statistics shown in header
- Updates in real-time
- Shows: Slices, Flows, Hosts, Switches counts

## Stopping the Dashboard

Press `Ctrl+C` in each terminal window to stop the servers.

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Backend Not Loading Data
```bash
# Check if simulation results exist
ls -la sdn_dashboard/simulations/results/
# Should see: controller_state.json, topology.json
```

### Frontend Build Errors
```bash
# Clear cache and reinstall
cd sdn_dashboard/dashboard/frontend
rm -rf node_modules package-lock.json
npm install
```

### Cannot Connect to Backend
```bash
# Verify backend is running
curl http://localhost:3001/api/health

# Should return: {"status":"healthy",...}
```

## Quick Commands

```bash
# Check if servers are running
lsof -ti:3000  # Frontend
lsof -ti:3001  # Backend

# View backend logs
cd sdn_dashboard/dashboard/backend
npm start  # Shows live logs

# Build production frontend
cd sdn_dashboard/dashboard/frontend
npm run build  # Creates build/ directory

# Test backend API
curl http://localhost:3001/api/slices | python3 -m json.tool
```

## Default Data

When you first start the dashboard, you'll see:
- **3 Slices:** Tenant_A, Tenant_B, Tenant_C
- **12 Flows:** 4 flows per slice
- **21 Nodes:** 1 controller + 8 switches + 12 hosts

## Next Steps

- Read [MILESTONE1_COMPLETE.md](MILESTONE1_COMPLETE.md) for full project details
- Read [implementation.md](implementation.md) for technical implementation
- Check [PHASE5_COMPLETE.md](PHASE5_COMPLETE.md) for frontend details

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the console logs in both terminals
3. Verify all dependencies are installed
4. Ensure ports 3000 and 3001 are available

---

**That's it! You're ready to manage your SDN network.**
