import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const getUserSettings = async (userId) => {
  if (!userId) return null;

  const settingsRef = doc(db, "users", userId, "settings", "preferences");
  const snap = await getDoc(settingsRef);

  if (snap.exists()) {
    return snap.data();
  }

  // Default settings if none exist
  const defaultSettings = {
    showConfusedWords: true,
    showTranslation: true,
    showConfusedWords: true,
    askBeforeDefining: true,
    preferredLanguage: "ceb"
  };

  await setDoc(settingsRef, defaultSettings);
  return defaultSettings;
};

export const updateUserSettings = async (userId, newSettings) => {
  if (!userId) return;

  const settingsRef = doc(db, "users", userId, "settings", "preferences");

  await setDoc(settingsRef, newSettings, { merge: true });
};