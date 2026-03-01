import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../services/firebase";
import api from './api';

export const notebookService = {
  getNotebook: async (id) => {
    const response = await api.get(`/api/notebook/${id}`);
    return response.data;
  },

  getHistory: async () => {
    const response = await api.get('/api/history');
    return response.data;
  },

  getConfusionTerms: async () => {
    const response = await api.get('/api/confusion-terms');
    return response.data;
  },

  getDefinition: async (word) => {
    const response = await api.post('/api/define', {
      word,
      context: "legal document"
    });
    return response.data;
  },

  addToHistory: async (word) => {
    const response = await api.post('/api/history/add', { word });
    return response.data.history;
  },

  getDocuments: async (userId, notebookId) => {
    const querySnapshot = await getDocs(
      collection(db, "users", userId, "notebooks", notebookId, "documents")
    );

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  uploadDocument: async (file, notebookId, userId) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("notebook_id", notebookId);
    formData.append("user_id", userId);

    const response = await fetch("http://localhost:8000/sources/upload", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error("Failed to upload document");
    }

    const data = await response.json();

    const docRef = await addDoc(
      collection(db, "users", userId, "notebooks", notebookId, "documents"),
      {
        fileName: data.fileName,
        fileURL: data.fileURL,
        uploadDate: serverTimestamp()
      }
    );

    return { id: docRef.id, fileName: data.fileName, fileURL: data.fileURL };
  }
};