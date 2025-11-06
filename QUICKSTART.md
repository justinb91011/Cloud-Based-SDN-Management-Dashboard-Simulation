# Quick Start Guide - SDN Dashboard

**Get the system running in 3 minutes!**

---

## Prerequisites Check

```bash
# Verify Node.js installed
node --version   # Should be v18+

# Verify npm installed
npm --version    # Should be 8+

# Verify OMNeT++ (optional for full integration)
omnetpp -v      # Should show version 6.0+
```

---

## Running the System

### Option 1: Demo Mode (Fastest - No Simulation Required)

Just backend + frontend using pre-generated data files.

#### Terminal 1: Start Backend

```bash
cd sdn_dashboard/dashboard/backend
npm start
```

Wait for:

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

Wait for:

```
Compiled successfully!

You can now view sdn-dashboard-frontend in the browser.

  Local:            http://localhost:3000
```

Browser opens automatically to dashboard! 🎉

---

**Need Help?**

- Read: [README.md](sdn_dashboard/README.md)
- Test: `./test_integration.sh`
