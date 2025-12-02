const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const WebSocket = require('ws');
const path = require('path');
const MetricsCollector = require('./metricsCollector');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Path to OMNeT++ simulation results
const RESULTS_DIR = path.join(__dirname, '../../simulations/results');
const STATE_FILE = path.join(RESULTS_DIR, 'controller_state.json');
const TOPOLOGY_FILE = path.join(RESULTS_DIR, 'topology.json');

// In-memory cache
let currentState = {
    slices: [],
    flows: [],
    timestamp: 0
};

let topology = {
    nodes: [],
    links: []
};

// Initialize metrics collector
const metricsCollector = new MetricsCollector(RESULTS_DIR);

// Record system load periodically
setInterval(() => {
    metricsCollector.recordSystemLoad();
}, 30000); // Every 30 seconds

// Middleware to track API response times
app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        metricsCollector.recordAPIResponse(req.path, duration);
    });

    next();
});

// Load initial data
function loadState() {
    try {
        if (fs.existsSync(STATE_FILE)) {
            const data = fs.readFileSync(STATE_FILE, 'utf8');
            currentState = JSON.parse(data);
            console.log('Loaded state:', currentState.slices.length, 'slices,', currentState.flows.length, 'flows');
        } else {
            console.warn('State file not found:', STATE_FILE);
        }
    } catch (err) {
        console.error('Error loading state:', err);
    }
}

function loadTopology() {
    try {
        if (fs.existsSync(TOPOLOGY_FILE)) {
            const data = fs.readFileSync(TOPOLOGY_FILE, 'utf8');
            topology = JSON.parse(data);
            console.log('Loaded topology:', topology.nodes.length, 'nodes');
        } else {
            console.warn('Topology file not found:', TOPOLOGY_FILE);
        }
    } catch (err) {
        console.error('Error loading topology:', err);
    }
}

// Watch for file changes
if (fs.existsSync(RESULTS_DIR)) {
    fs.watch(RESULTS_DIR, (eventType, filename) => {
        if (filename === 'controller_state.json') {
            console.log('State file changed, reloading...');
            setTimeout(loadState, 100);  // Small delay to ensure write is complete
            broadcastUpdate();
        }
    });
    console.log('Watching directory:', RESULTS_DIR);
} else {
    console.warn('Results directory not found:', RESULTS_DIR);
}

// REST API Endpoints

// Get topology
app.get('/api/topology', (req, res) => {
    res.json(topology);
});

// Get all slices
app.get('/api/slices', (req, res) => {
    res.json(currentState.slices || []);
});

// Get specific slice
app.get('/api/slices/:id', (req, res) => {
    const sliceId = parseInt(req.params.id);
    const slice = currentState.slices.find(s => s.id === sliceId);

    if (slice) {
        res.json(slice);
    } else {
        res.status(404).json({ error: 'Slice not found' });
    }
});

// Create new slice
app.post('/api/slices', (req, res) => {
    const start = Date.now();
    const { name, vlanId, bandwidth, hosts, isolated, acl } = req.body;

    // Validate input
    if (!name || !vlanId || !bandwidth || !hosts) {
        const duration = Date.now() - start;
        metricsCollector.recordSliceOperation('create', 0, duration, false);
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create slice object
    const newSlice = {
        id: currentState.slices.length + 1,
        name,
        vlanId,
        bandwidth,
        hosts,
        isolated: isolated !== undefined ? isolated : true,
        acl: acl || []
    };

    // TODO: Send to OMNeT++ controller via command interface
    // For now, add to local state
    currentState.slices.push(newSlice);

    // Write command file for OMNeT++ to pick up
    const command = {
        type: 'CREATE_SLICE',
        data: newSlice,
        timestamp: Date.now()
    };

    fs.writeFileSync(
        path.join(RESULTS_DIR, 'commands.json'),
        JSON.stringify(command, null, 2)
    );

    const duration = Date.now() - start;
    metricsCollector.recordSliceOperation('create', newSlice.id, duration, true);

    broadcastUpdate();
    res.status(201).json(newSlice);
});

// Update slice
app.put('/api/slices/:id', (req, res) => {
    const sliceId = parseInt(req.params.id);
    const sliceIndex = currentState.slices.findIndex(s => s.id === sliceId);

    if (sliceIndex === -1) {
        return res.status(404).json({ error: 'Slice not found' });
    }

    // Update slice
    currentState.slices[sliceIndex] = {
        ...currentState.slices[sliceIndex],
        ...req.body,
        id: sliceId  // Ensure ID doesn't change
    };

    // Send update command to OMNeT++
    const command = {
        type: 'UPDATE_SLICE',
        data: currentState.slices[sliceIndex],
        timestamp: Date.now()
    };

    fs.writeFileSync(
        path.join(RESULTS_DIR, 'commands.json'),
        JSON.stringify(command, null, 2)
    );

    broadcastUpdate();
    res.json(currentState.slices[sliceIndex]);
});

// Delete slice
app.delete('/api/slices/:id', (req, res) => {
    const start = Date.now();
    const sliceId = parseInt(req.params.id);
    const sliceIndex = currentState.slices.findIndex(s => s.id === sliceId);

    if (sliceIndex === -1) {
        const duration = Date.now() - start;
        metricsCollector.recordSliceOperation('delete', sliceId, duration, false);
        return res.status(404).json({ error: 'Slice not found' });
    }

    // Remove slice
    const deletedSlice = currentState.slices.splice(sliceIndex, 1)[0];

    // Send delete command to OMNeT++
    const command = {
        type: 'DELETE_SLICE',
        data: { id: sliceId },
        timestamp: Date.now()
    };

    fs.writeFileSync(
        path.join(RESULTS_DIR, 'commands.json'),
        JSON.stringify(command, null, 2)
    );

    const duration = Date.now() - start;
    metricsCollector.recordSliceOperation('delete', sliceId, duration, true);

    broadcastUpdate();
    res.json(deletedSlice);
});

// Get all flows
app.get('/api/flows', (req, res) => {
    const sliceId = req.query.sliceId;

    let flows = currentState.flows || [];

    if (sliceId) {
        flows = flows.filter(f => f.sliceId === parseInt(sliceId));
    }

    res.json(flows);
});

// Get specific flow
app.get('/api/flows/:id', (req, res) => {
    const flowId = parseInt(req.params.id);
    const flow = currentState.flows.find(f => f.id === flowId);

    if (flow) {
        res.json(flow);
    } else {
        res.status(404).json({ error: 'Flow not found' });
    }
});

// Create new flow
app.post('/api/flows', (req, res) => {
    const start = Date.now();
    const { srcIP, dstIP, action, priority, sliceId } = req.body;

    if (!srcIP || !dstIP || !action) {
        const duration = Date.now() - start;
        metricsCollector.recordFlowOperation('add', 0, duration, false);
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const newFlow = {
        id: currentState.flows.length + 1,
        srcIP,
        dstIP,
        action,
        priority: priority || 100,
        sliceId: sliceId || 0,
        packets: 0,
        bytes: 0
    };

    currentState.flows.push(newFlow);

    // Send command to OMNeT++
    const command = {
        type: 'ADD_FLOW',
        data: newFlow,
        timestamp: Date.now()
    };

    fs.writeFileSync(
        path.join(RESULTS_DIR, 'commands.json'),
        JSON.stringify(command, null, 2)
    );

    const duration = Date.now() - start;
    metricsCollector.recordFlowOperation('add', newFlow.id, duration, true);

    broadcastUpdate();
    res.status(201).json(newFlow);
});

// Delete flow
app.delete('/api/flows/:id', (req, res) => {
    const start = Date.now();
    const flowId = parseInt(req.params.id);
    const flowIndex = currentState.flows.findIndex(f => f.id === flowId);

    if (flowIndex === -1) {
        const duration = Date.now() - start;
        metricsCollector.recordFlowOperation('delete', flowId, duration, false);
        return res.status(404).json({ error: 'Flow not found' });
    }

    const deletedFlow = currentState.flows.splice(flowIndex, 1)[0];

    // Send command to OMNeT++
    const command = {
        type: 'DELETE_FLOW',
        data: { id: flowId },
        timestamp: Date.now()
    };

    fs.writeFileSync(
        path.join(RESULTS_DIR, 'commands.json'),
        JSON.stringify(command, null, 2)
    );

    const duration = Date.now() - start;
    metricsCollector.recordFlowOperation('delete', flowId, duration, true);

    broadcastUpdate();
    res.json(deletedFlow);
});

// Get statistics
app.get('/api/statistics', (req, res) => {
    const stats = {
        totalSlices: currentState.slices.length,
        totalFlows: currentState.flows.length,
        totalHosts: topology.nodes.filter(n => n.type === 'host').length,
        totalSwitches: topology.nodes.filter(n => n.type === 'switch').length,
        timestamp: currentState.timestamp
    };

    res.json(stats);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        dataLoaded: {
            slices: currentState.slices.length,
            flows: currentState.flows.length,
            nodes: topology.nodes.length
        }
    });
});

// Status endpoint for connection health
app.get('/api/status', (req, res) => {
    res.json({
        server: 'running',
        websocket: {
            connected: connectionState.connected,
            clients: wss.clients.size,
            lastHeartbeat: connectionState.lastHeartbeat
        },
        simulation: {
            stateFileExists: fs.existsSync(STATE_FILE),
            lastUpdate: currentState.timestamp
        }
    });
});

// Metrics endpoints
app.get('/api/metrics', (req, res) => {
    res.json(metricsCollector.getStats());
});

app.get('/api/metrics/recent', (req, res) => {
    const count = parseInt(req.query.count) || 100;
    res.json(metricsCollector.getRecentMetrics(count));
});

// --- Experiment Endpoints ---

let experiments = [];
let activeExperimentId = null;

// List experiments (In a real app, this would query a database)
app.get('/api/experiments', (req, res) => {
    // For now, return a static list or in-memory list
    res.json(experiments);
});

// Start experiment
app.post('/api/experiments', (req, res) => {
    const start = Date.now();
    const { scenarioId, tenantCount, sliceCount, loadLevel, aclPattern } = req.body;

    const experimentId = `exp_${Date.now()}`;
    activeExperimentId = experimentId;

    const newExperiment = {
        id: experimentId,
        name: `${scenarioId} (${new Date().toLocaleTimeString()})`,
        config: { scenarioId, tenantCount, sliceCount, loadLevel, aclPattern },
        status: 'running',
        progress: 0,
        timestamp: Date.now(),
        metrics: null
    };

    experiments.unshift(newExperiment);

    // Send START_EXPERIMENT command to OMNeT++
    const command = {
        type: 'START_EXPERIMENT',
        data: {
            experimentId,
            config: newExperiment.config
        },
        timestamp: Date.now()
    };

    fs.writeFileSync(
        path.join(RESULTS_DIR, 'commands.json'),
        JSON.stringify(command, null, 2)
    );

    const duration = Date.now() - start;
    metricsCollector.recordAPIResponse('/api/experiments', duration); // Reuse metric recording

    console.log(`Started experiment ${experimentId}`);
    res.json({ experimentId });
});

// Get experiment status
app.get('/api/experiments/:id/status', (req, res) => {
    const exp = experiments.find(e => e.id === req.params.id);
    if (!exp) return res.status(404).json({ error: 'Experiment not found' });

    // Check if experiment is done (logic depends on simulation feedback)
    // For now, we can check if metrics file has a "done" flag or similar, 
    // or just rely on the simulation running state.
    // Let's assume the simulation updates the status in a file or we infer it.

    // For this phase, we'll keep it simple: if it's the active one, it's running.
    // If we have metrics, it might be done or running.

    res.json({ status: exp.status, progress: exp.progress });
});

// Get experiment metrics
app.get('/api/experiments/:id/metrics', (req, res) => {
    const exp = experiments.find(e => e.id === req.params.id);
    if (!exp) return res.status(404).json({ error: 'Experiment not found' });

    // Read latest metrics from file if it's the active experiment
    if (exp.id === activeExperimentId) {
        const metricsPath = path.join(RESULTS_DIR, 'metrics.json');
        if (fs.existsSync(metricsPath)) {
            try {
                const data = fs.readFileSync(metricsPath, 'utf8');
                exp.metrics = JSON.parse(data);
            } catch (err) {
                console.error("Error reading metrics.json", err);
            }
        }
    }

    if (!exp.metrics) return res.status(400).json({ error: 'Metrics not available yet' });

    // Handle format=csv
    if (req.query.format === 'csv') {
        res.header('Content-Type', 'text/csv');
        res.attachment(`${exp.id}_metrics.csv`);
        return res.send(generateCsv(exp.metrics));
    }

    res.json(exp.metrics);
});

// Watch for metrics.json changes to broadcast updates
const METRICS_FILE = path.join(RESULTS_DIR, 'metrics.json');
if (fs.existsSync(RESULTS_DIR)) {
    fs.watch(RESULTS_DIR, (eventType, filename) => {
        if (filename === 'metrics.json' && activeExperimentId) {
            // Broadcast metrics update
            // Add debounce to avoid reading file while it's being written
            setTimeout(() => {
                try {
                    if (fs.existsSync(METRICS_FILE)) {
                        const data = fs.readFileSync(METRICS_FILE, 'utf8');
                        if (!data || data.trim() === '') return; // Skip empty files

                        const metrics = JSON.parse(data);

                        // Update in-memory experiment
                        const exp = experiments.find(e => e.id === activeExperimentId);
                        if (exp) {
                            exp.metrics = metrics;
                            // Update progress based on simulation time (assuming 1000s limit)
                            if (metrics.timestamp) {
                                exp.progress = Math.min(100, (metrics.timestamp / 1000) * 100);

                                // Auto-complete experiment when progress reaches 100%
                                if (exp.progress >= 100 && exp.status === 'running') {
                                    exp.status = 'completed';
                                    exp.endTime = new Date().toISOString();
                                    exp.results = {
                                        csv: generateCsv(metrics),
                                        summary: metrics.summary || {},
                                        finalMetrics: metrics
                                    };
                                    console.log(`✅ Experiment ${exp.id} completed automatically at ${exp.endTime}`);
                                }
                            }
                        }

                        // Broadcast to WebSocket clients
                        const message = JSON.stringify({
                            type: 'METRICS_UPDATE',
                            data: metrics,
                            experimentId: activeExperimentId
                        });

                        wss.clients.forEach((client) => {
                            if (client.readyState === WebSocket.OPEN) {
                                client.send(message);
                            }
                        });
                    }
                } catch (err) {
                    // Silently ignore JSON parse errors (file still being written)
                    if (!(err instanceof SyntaxError)) {
                        console.error("Error broadcasting metrics:", err);
                    }
                }
            }, 150); // 150ms debounce
        }
    });
}

function generateCsv(metrics) {
    if (!metrics || !metrics.summary) return "";
    const header = 'SliceID,AvgLatency,P95Latency,AvgThroughput,ACLHitRate\n';
    const rows = Object.keys(metrics.summary).map(id => {
        const m = metrics.summary[id];
        return `${id},${m.avgLatency},${m.p95Latency},${m.avgThroughput},${m.aclHitRate}`;
    }).join('\n');
    return header + rows;
}

// WebSocket for real-time updates
const wss = new WebSocket.Server({ noServer: true });

// Connection state management
let connectionState = {
    connected: false,
    lastHeartbeat: Date.now(),
    reconnectAttempts: 0,
    maxReconnectAttempts: 5
};

// Enhanced WebSocket connection with heartbeat
wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    connectionState.connected = true;
    connectionState.reconnectAttempts = 0;

    // Send initial state with connection confirmation
    ws.send(JSON.stringify({
        type: 'CONNECTION_ESTABLISHED',
        data: {
            timestamp: Date.now(),
            status: 'connected'
        }
    }));

    ws.send(JSON.stringify({
        type: 'INITIAL_STATE',
        data: currentState
    }));

    // Heartbeat mechanism
    const heartbeatInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'HEARTBEAT',
                timestamp: Date.now()
            }));
            connectionState.lastHeartbeat = Date.now();
        }
    }, 10000); // Every 10 seconds

    ws.on('message', (message) => {
        try {
            const msg = JSON.parse(message.toString());

            // Handle heartbeat acknowledgment
            if (msg.type === 'HEARTBEAT_ACK') {
                connectionState.lastHeartbeat = Date.now();
            }

            // Handle other messages
            console.log('Received:', msg);
        } catch (err) {
            console.error('Error parsing message:', err);
        }
    });

    ws.on('close', () => {
        console.log('WebSocket client disconnected');
        connectionState.connected = false;
        clearInterval(heartbeatInterval);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'ERROR',
                data: {
                    message: 'Connection error occurred',
                    timestamp: Date.now()
                }
            }));
        }
    });
});

// Enhanced broadcast with error handling
function broadcastUpdate(updateType = 'STATE_UPDATE') {
    const message = JSON.stringify({
        type: updateType,
        data: currentState,
        timestamp: Date.now()
    });

    let successCount = 0;
    let failCount = 0;

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            try {
                client.send(message);
                successCount++;
            } catch (err) {
                console.error('Error broadcasting to client:', err);
                failCount++;
            }
        }
    });

    if (successCount > 0 || failCount > 0) {
        console.log(`Broadcast: ${successCount} succeeded, ${failCount} failed`);
    }
}

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log('SDN Dashboard Backend Server');
    console.log('='.repeat(60));
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
    console.log(`WebSocket available at ws://localhost:${PORT}`);
    console.log('-'.repeat(60));
    console.log('Loading simulation data...');
    loadState();
    loadTopology();
    console.log('='.repeat(60));
    console.log('\nAvailable endpoints:');
    console.log('  GET  /api/health');
    console.log('  GET  /api/status');
    console.log('  GET  /api/topology');
    console.log('  GET  /api/slices');
    console.log('  GET  /api/slices/:id');
    console.log('  POST /api/slices');
    console.log('  PUT  /api/slices/:id');
    console.log('  DELETE /api/slices/:id');
    console.log('  GET  /api/flows');
    console.log('  GET  /api/flows/:id');
    console.log('  POST /api/flows');
    console.log('  DELETE /api/flows/:id');
    console.log('  GET  /api/statistics');
    console.log('='.repeat(60));
});

// Upgrade HTTP server to handle WebSocket
server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\nSIGTERM received, closing server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\nSIGINT received, closing server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

module.exports = server;
