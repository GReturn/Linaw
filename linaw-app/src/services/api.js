// src/services/api.js
const API_BASE_URL = 'http://localhost:8000';

export const api = {
  // Health check
  checkHealth: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.json();
  },

  // Get welcome message
  getWelcome: async () => {
    const response = await fetch(`${API_BASE_URL}/`);
    return response.json();
  },

  // Get item by ID
  getItem: async (itemId, query = null) => {
    const url = query
      ? `${API_BASE_URL}/items/${itemId}?q=${query}`
      : `${API_BASE_URL}/items/${itemId}`;
    const response = await fetch(url);
    return response.json();
  }
};