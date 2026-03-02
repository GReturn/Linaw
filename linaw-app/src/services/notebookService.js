import { collection, addDoc, getDocs, serverTimestamp, doc } from "firebase/firestore";
import { db } from "../services/firebase";
import { getExplanation, getHistory as fetchHistory } from './dictionaryService';

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
  /**
   * Fetches the definition for a term.
   * Checks Firebase global_dictionary first; falls back to mock (TODO: Gemini).
   * Also records the lookup in the user's personal notebook dictionary.
   */
  getDefinition: async (userId, notebookId, word, language = "cebuano") => {
    return getExplanation(userId, notebookId, word, language);
  },

  /**
   * Returns the user's recently looked-up terms for this notebook,
   * ordered by most recently accessed. Persisted in Firestore.
   */
  getHistory: async (userId, notebookId) => {
    return fetchHistory(userId, notebookId);
  },

  /**
   * No-op: history is recorded automatically inside getDefinition.
   * Kept for call-site compatibility during transition.
   */
  addToHistory: async (_userId, _notebookId, _word) => {
    // Side-effect handled by getExplanation → no separate call needed
    return [];
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