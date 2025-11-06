import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import TopologyView from './components/TopologyView';
import SlicePanel from './components/SlicePanel';
import FlowPanel from './components/FlowPanel';
import Statistics from './components/Statistics';
import ConnectionStatus from './components/ConnectionStatus';
import api from './services/api';

function App() {
  const [slices, setSlices] = useState([]);
  const [flows, setFlows] = useState([]);
  const [topology, setTopology] = useState({ nodes: [], links: [] });
  const [statistics, setStatistics] = useState({});
  const [selectedSlice, setSelectedSlice] = useState(null);
  const [ws, setWs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    lastUpdate: null,
    error: null,
    reconnecting: false
  });

  const connectWebSocket = useCallback(() => {
    console.log('Attempting WebSocket connection...');
    setConnectionStatus(prev => ({ ...prev, reconnecting: true }));

    const websocket = new WebSocket('ws://localhost:3001');

    websocket.onopen = () => {
      console.log('WebSocket connected');
      setConnectionStatus({
        connected: true,
        lastUpdate: new Date(),
        error: null,
        reconnecting: false
      });
    };

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setConnectionStatus(prev => ({ ...prev, lastUpdate: new Date() }));

      switch (message.type) {
        case 'CONNECTION_ESTABLISHED':
          console.log('Connection established:', message.data);
          break;

        case 'INITIAL_STATE':
        case 'STATE_UPDATE':
          setSlices(message.data.slices || []);
          setFlows(message.data.flows || []);
          loadStatistics();
          break;

        case 'HEARTBEAT':
          // Acknowledge heartbeat
          if (websocket.readyState === WebSocket.OPEN) {
            websocket.send(JSON.stringify({ type: 'HEARTBEAT_ACK' }));
          }
          break;

        case 'ERROR':
          setConnectionStatus(prev => ({
            ...prev,
            error: message.data.message
          }));
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus(prev => ({
        ...prev,
        connected: false,
        error: 'Connection error occurred'
      }));
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setConnectionStatus(prev => ({
        ...prev,
        connected: false,
        error: 'Connection lost'
      }));

      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        console.log('Attempting to reconnect...');
        connectWebSocket();
      }, 3000);
    };

    setWs(websocket);

    return websocket;
  }, []);

  // Load initial data
  useEffect(() => {
    loadData();
    const websocket = connectWebSocket();

    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, [connectWebSocket]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [slicesData, flowsData, topoData, statsData] = await Promise.all([
        api.getSlices(),
        api.getFlows(),
        api.getTopology(),
        api.getStatistics()
      ]);

      setSlices(slicesData);
      setFlows(flowsData);
      setTopology(topoData);
      setStatistics(statsData);
      setError(null);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data from backend. Make sure the backend server is running on port 3001.');
      setConnectionStatus(prev => ({
        ...prev,
        error: 'Failed to load data from server'
      }));
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const statsData = await api.getStatistics();
      setStatistics(statsData);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleCreateSlice = async (sliceData) => {
    try {
      const newSlice = await api.createSlice(sliceData);
      setSlices([...slices, newSlice]);
      loadStatistics();
    } catch (error) {
      console.error('Error creating slice:', error);
      alert('Failed to create slice: ' + error.message);
    }
  };

  const handleDeleteSlice = async (sliceId) => {
    try {
      await api.deleteSlice(sliceId);
      setSlices(slices.filter(s => s.id !== sliceId));

      // Remove flows associated with this slice
      setFlows(flows.filter(f => f.sliceId !== sliceId));

      // Deselect if this was the selected slice
      if (selectedSlice?.id === sliceId) {
        setSelectedSlice(null);
      }

      loadStatistics();
    } catch (error) {
      console.error('Error deleting slice:', error);
      alert('Failed to delete slice: ' + error.message);
    }
  };

  const handleUpdateSlice = async (sliceId, updates) => {
    try {
      const updatedSlice = await api.updateSlice(sliceId, updates);
      setSlices(slices.map(s => s.id === sliceId ? updatedSlice : s));
    } catch (error) {
      console.error('Error updating slice:', error);
      alert('Failed to update slice: ' + error.message);
    }
  };

  const handleAddFlow = async (flowData) => {
    try {
      const newFlow = await api.addFlow(flowData);
      setFlows([...flows, newFlow]);
      loadStatistics();
    } catch (error) {
      console.error('Error adding flow:', error);
      alert('Failed to add flow: ' + error.message);
    }
  };

  const handleDeleteFlow = async (flowId) => {
    try {
      await api.deleteFlow(flowId);
      setFlows(flows.filter(f => f.id !== flowId));
      loadStatistics();
    } catch (error) {
      console.error('Error deleting flow:', error);
      alert('Failed to delete flow: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="App">
        <div className="loading">
          <h2>Loading SDN Dashboard...</h2>
          <p>Connecting to backend server...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="App">
        <div className="error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={loadData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Cloud-Based SDN Management Dashboard</h1>
        <ConnectionStatus status={connectionStatus} />
        <Statistics data={statistics} />
      </header>

      <div className="main-content">
        <div className="topology-section">
          <TopologyView
            topology={topology}
            slices={slices}
            selectedSlice={selectedSlice}
          />
        </div>

        <div className="control-panels">
          <SlicePanel
            slices={slices}
            onCreateSlice={handleCreateSlice}
            onDeleteSlice={handleDeleteSlice}
            onUpdateSlice={handleUpdateSlice}
            onSelectSlice={setSelectedSlice}
            selectedSlice={selectedSlice}
          />

          <FlowPanel
            flows={flows}
            slices={slices}
            selectedSlice={selectedSlice}
            onAddFlow={handleAddFlow}
            onDeleteFlow={handleDeleteFlow}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
