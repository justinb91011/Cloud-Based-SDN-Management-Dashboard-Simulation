import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:3001/api';

const experimentApi = {
  // List available scenarios/presets
  listScenarios: async () => {
    // In a real app, this might come from the backend. 
    // For now, we can return hardcoded presets or fetch if endpoint exists.
    return [
      { id: 'STRESS_MAX_SLICES', name: 'Stress Test: Max Slices', description: 'Push slice count to limit' },
      { id: 'HIGH_THROUGHPUT', name: 'High Throughput', description: 'Saturate links with high traffic' },
      { id: 'ACL_COMPLEXITY', name: 'ACL Complexity', description: 'Many conflicting ACL rules' },
      { id: 'CUSTOM', name: 'Custom Configuration', description: 'Manually configure parameters' }
    ];
  },

  // Start a new experiment
  runExperiment: async (config) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/experiments`, config);
      return response.data; // Should contain experimentId
    } catch (error) {
      console.error("Failed to start experiment:", error);
      throw error;
    }
  },

  // Get status of a running experiment
  getExperimentStatus: async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/experiments/${id}/status`);
      return response.data; // { status: 'running' | 'done' | 'failed', progress: 0-100 }
    } catch (error) {
      console.error("Failed to get experiment status:", error);
      throw error;
    }
  },

  // Stop a running experiment
  stopExperiment: async (id) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/experiments/${id}/stop`);
      return response.data;
    } catch (error) {
      console.error("Failed to stop experiment:", error);
      throw error;
    }
  },

  // Get metrics for a completed experiment
  getExperimentMetrics: async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/experiments/${id}/metrics`);
      return response.data;
    } catch (error) {
      console.error("Failed to get experiment metrics:", error);
      throw error;
    }
  },

  // Get list of past experiments (for comparison)
  getExperiments: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/experiments`);
      return response.data;
    } catch (error) {
      console.error("Failed to list experiments:", error);
      throw error;
    }
  },

  // Export metrics
  exportMetrics: (id, format = 'csv') => {
    window.open(`${API_BASE_URL}/experiments/${id}/metrics?format=${format}`, '_blank');
  }
};

export default experimentApi;
