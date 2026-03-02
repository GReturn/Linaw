import axios from 'axios';
import { auth } from './firebase';

// Create an instance of axios with the base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
});

// Export the Axios instance as default for ad-hoc requests
export default api;
