// Simple WebSocket client test
const WebSocket = require('ws');

console.log('Connecting to WebSocket server...');
const ws = new WebSocket('ws://localhost:3001');

ws.on('open', function open() {
    console.log('✓ Connected to WebSocket server');
});

ws.on('message', function incoming(data) {
    const message = JSON.parse(data);
    console.log('\n✓ Received message:');
    console.log('  Type:', message.type);
    if (message.data.slices) {
        console.log('  Slices:', message.data.slices.length);
    }
    if (message.data.flows) {
        console.log('  Flows:', message.data.flows.length);
    }

    // Close after receiving initial state
    if (message.type === 'INITIAL_STATE') {
        console.log('\n✓ WebSocket test successful!');
        ws.close();
        process.exit(0);
    }
});

ws.on('error', function error(err) {
    console.error('✗ WebSocket error:', err);
    process.exit(1);
});

ws.on('close', function close() {
    console.log('✓ WebSocket connection closed');
});

// Timeout after 5 seconds
setTimeout(() => {
    console.error('✗ Test timed out');
    ws.close();
    process.exit(1);
}, 5000);
