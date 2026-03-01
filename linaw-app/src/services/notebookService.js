import { collection, addDoc, getDocs } from "firebase/firestore";
import { db, auth } from "../services/firebase";

// Create notebook
export const createNotebook = async (title) => {
  const user = auth.currentUser;
  if (!user) throw new Error("User not logged in");

  return await addDoc(
    collection(db, "users", user.uid, "notebooks"),
    {
      title,
      createdAt: new Date()
    }
  );
};

// Get notebooks
export const getNotebooks = async () => {
  const user = auth.currentUser;
  if (!user) return [];

  const snapshot = await getDocs(
    collection(db, "users", user.uid, "notebooks")
  );

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};