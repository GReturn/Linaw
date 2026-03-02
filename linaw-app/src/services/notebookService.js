import { collection, addDoc, getDocs, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../services/firebase";
import api from './api';
import { v4 as uuidv4 } from 'uuid';

export const createNotebook = async (userId, title) => {
  const notebooksRef = collection(db, "users", userId, "notebooks");
  const docRef = await addDoc(notebooksRef, {
    title: title.trim(),
    createdAt: serverTimestamp(),
  });

  const notebookPath = ["users", userId, "notebooks", docRef.id];

  await addDoc(collection(db, ...notebookPath, "dictionary"), {
    _placeholder: true,
    term: "",
    definition: "",
    language: "",
    example: "",
    image_url: "",
    image_source: "",
    attribution: "",
    createdAt: serverTimestamp(),
    lastAccessed: serverTimestamp(),
  });

  await addDoc(collection(db, ...notebookPath, "documents"), {
    _placeholder: true,
    fileName: "",
    filePath: "",
    uploadDate: serverTimestamp(),
  });

  return { id: docRef.id, title };
};


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

    return querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(doc => !doc._placeholder);  // exclude initialisation placeholder
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
        fileName: file.name,
        filePath: data.fileURL,
        uploadDate: serverTimestamp(),
      }
    );

    return { id: docRef.id, fileName: file.name, filePath: data.fileURL };
  }
};