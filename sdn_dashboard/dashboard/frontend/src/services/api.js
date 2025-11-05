import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = {
  // Topology
  getTopology: async () => {
    const response = await axios.get(`${API_BASE_URL}/topology`);
    return response.data;
  },

  // Slices
  getSlices: async () => {
    const response = await axios.get(`${API_BASE_URL}/slices`);
    return response.data;
  },

  getSlice: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/slices/${id}`);
    return response.data;
  },

  createSlice: async (sliceData) => {
    const response = await axios.post(`${API_BASE_URL}/slices`, sliceData);
    return response.data;
  },

  updateSlice: async (id, updates) => {
    const response = await axios.put(`${API_BASE_URL}/slices/${id}`, updates);
    return response.data;
  },

  deleteSlice: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/slices/${id}`);
    return response.data;
  },

  // Flows
  getFlows: async (sliceId = null) => {
    const url = sliceId
      ? `${API_BASE_URL}/flows?sliceId=${sliceId}`
      : `${API_BASE_URL}/flows`;
    const response = await axios.get(url);
    return response.data;
  },

  getFlow: async (id) => {
    const response = await axios.get(`${API_BASE_URL}/flows/${id}`);
    return response.data;
  },

  addFlow: async (flowData) => {
    const response = await axios.post(`${API_BASE_URL}/flows`, flowData);
    return response.data;
  },

  deleteFlow: async (id) => {
    const response = await axios.delete(`${API_BASE_URL}/flows/${id}`);
    return response.data;
  },

  // Statistics
  getStatistics: async () => {
    const response = await axios.get(`${API_BASE_URL}/statistics`);
    return response.data;
  }
};

export default api;
