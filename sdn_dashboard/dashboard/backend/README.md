# SDN Dashboard Backend

Backend API server for the Cloud-Based SDN Management Dashboard. Provides REST API and WebSocket endpoints for managing network slices and flows in the OMNeT++ simulation.

## Features

- ✅ REST API for slice and flow management
- ✅ WebSocket server for real-time updates
- ✅ File watcher for automatic data synchronization
- ✅ Command interface for OMNeT++ communication
- ✅ CORS enabled for frontend integration
- ✅ Comprehensive statistics endpoint

## Prerequisites

- Node.js v18+ (tested with v24.8.0)
- npm v9+
- Running OMNeT++ simulation with JSON output

## Installation

```bash
cd sdn_dashboard/dashboard/backend
npm install
```

## Running the Server

### Development Mode
```bash
npm start
```

### With Auto-reload (using nodemon)
```bash
npm run dev
```

## API Endpoints

### Health Check
```bash
GET /api/health
```
Returns server status and data loading information.

### Topology
```bash
GET /api/topology
```
Returns network topology (nodes and links).

### Slices

#### Get All Slices
```bash
GET /api/slices
```

#### Get Specific Slice
```bash
GET /api/slices/:id
```

#### Create New Slice
```bash
POST /api/slices
Content-Type: application/json

{
  "name": "Tenant_D",
  "vlanId": 40,
  "bandwidth": 300,
  "hosts": ["10.0.40.1", "10.0.40.2"],
  "isolated": true
}
```

#### Update Slice
```bash
PUT /api/slices/:id
Content-Type: application/json

{
  "bandwidth": 500
}
```

#### Delete Slice
```bash
DELETE /api/slices/:id
```

### Flows

#### Get All Flows
```bash
GET /api/flows
```

#### Get Flows by Slice
```bash
GET /api/flows?sliceId=2
```

#### Get Specific Flow
```bash
GET /api/flows/:id
```

#### Create Flow Rule
```bash
POST /api/flows
Content-Type: application/json

{
  "srcIP": "10.0.1.1",
  "dstIP": "10.0.1.2",
  "action": "forward",
  "priority": 100,
  "sliceId": 2
}
```

#### Delete Flow
```bash
DELETE /api/flows/:id
```

### Statistics
```bash
GET /api/statistics
```

Returns aggregated network statistics:
- Total slices
- Total flows
- Total hosts
- Total switches
- Current timestamp

## WebSocket

Connect to `ws://localhost:3001` for real-time updates.

### Message Types

#### INITIAL_STATE
Sent immediately upon connection with current state.

```json
{
  "type": "INITIAL_STATE",
  "data": {
    "slices": [...],
    "flows": [...],
    "timestamp": 5
  }
}
```

#### STATE_UPDATE
Sent when simulation data changes.

```json
{
  "type": "STATE_UPDATE",
  "data": {
    "slices": [...],
    "flows": [...],
    "timestamp": 10
  }
}
```

## Data Files

The backend reads from and writes to the following files:

### Input (from OMNeT++ simulation)
- `../../simulations/results/controller_state.json` - Controller state (slices and flows)
- `../../simulations/results/topology.json` - Network topology

### Output (to OMNeT++ simulation)
- `../../simulations/results/commands.json` - Commands for the controller

## Command Interface

When you create, update, or delete slices/flows via the API, the backend writes commands to `commands.json` that can be picked up by the OMNeT++ controller.

### Command Format

```json
{
  "type": "CREATE_SLICE|UPDATE_SLICE|DELETE_SLICE|ADD_FLOW|DELETE_FLOW",
  "data": {...},
  "timestamp": 1762355615209
}
```

## Testing

Run the comprehensive test suite:

```bash
./test-phase4.sh
```

This validates:
- ✅ All REST endpoints (17 tests)
- ✅ HTTP status codes
- ✅ Data loading from simulation
- ✅ Command file generation
- ✅ Error handling

Test WebSocket functionality:

```bash
node test-websocket.js
```

## Architecture

```
┌─────────────────┐
│  OMNeT++        │
│  Simulation     │
│                 │
│  - Exports JSON │
└────────┬────────┘
         │
         │ File Watch
         ▼
┌─────────────────┐
│  Backend Server │
│  (Express)      │
│                 │
│  - REST API     │
│  - WebSocket    │
│  - File Watch   │
└────────┬────────┘
         │
         │ HTTP/WS
         ▼
┌─────────────────┐
│  Frontend       │
│  (React)        │
└─────────────────┘
```

## Configuration

Environment variables:
- `PORT` - Server port (default: 3001)

## Current Status

**Phase 4 Complete ✅**

All success criteria met:
- ✅ Backend server starts without errors
- ✅ Successfully loads controller_state.json and topology.json
- ✅ All 12 REST endpoints respond correctly
- ✅ WebSocket connection established
- ✅ File watcher detects JSON file changes
- ✅ Commands written to commands.json for OMNeT++ integration
- ✅ CORS configured for frontend (Phase 5)
- ✅ Statistics endpoint calculates correctly

### Loaded Data (from simulation)
- **3 Network Slices**: Tenant_A, Tenant_B, Tenant_C
- **12 Flow Rules**: 4 per slice
- **21 Topology Nodes**: 1 controller, 8 switches, 12 hosts

## Troubleshooting

### Server won't start
- Check if port 3001 is available: `lsof -i :3001`
- Verify Node.js version: `node --version`

### Data not loading
- Ensure simulation has been run at least once
- Check that JSON files exist in `simulations/results/`
- Verify file permissions

### WebSocket disconnects
- Check server logs for errors
- Verify no firewall blocking WebSocket connections

## Next Steps

Phase 5 (Frontend Development) will create a React dashboard that consumes this API.

## Authors

Justin and Taran
