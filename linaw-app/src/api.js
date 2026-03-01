import axios from 'axios';
import { auth } from './services/firebase';

// Create an instance of axios with the base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
});

// TO BE DETERMINED
// Automatically inject Firebase ID Token into every API request
api.interceptors.request.use(
  async (config) => {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==========================================
// DOCUMENTS
// ==========================================
export const getDocuments = async (notebookId) => {
  const { data } = await api.get(`/notebooks/${notebookId}/documents`);
  return data;
};

export const uploadDocument = async (notebookId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  // Optional: Add uploadDate or other metadata if needed by FastAPI
  const { data } = await api.post(`/notebooks/${notebookId}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

// ==========================================
// DICTIONARY ENTRIES (Notebook Specific)
// ==========================================
export const getDictionaryEntries = async (notebookId) => {
  const { data } = await api.get(`/notebooks/${notebookId}/dictionary`);
  return data;
};

export const saveDictionaryEntry = async (notebookId, termData) => {
  // termData should match the ERD: term, definition, language, example, image_url, etc.
  const { data } = await api.post(`/notebooks/${notebookId}/dictionary`, termData);
  return data;
};

export const updateLastAccessed = async (notebookId, entryId) => {
  const { data } = await api.patch(`/notebooks/${notebookId}/dictionary/${entryId}/accessed`);
  return data;
};

// ==========================================
// GLOBAL DICTIONARY
// ==========================================
export const getGlobalDictionaryTerm = async (term, language) => {
  const { data } = await api.get(`/global_dictionary/${term}`, {
    params: { language }
  });
  return data;
};

export const addGlobalDictionaryTerm = async (termData) => {
  const { data } = await api.post(`/global_dictionary`, termData);
  return data;
};

// Export the Axios instance as default for ad-hoc requests
export default api;
