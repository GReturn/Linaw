// src/services/dictionaryService.js
import { db } from './firebase';
import { doc, getDoc, setDoc, collection, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore';

/**
 * Looks up a term in the Firebase global dictionary.
 * If not found, falls back to a mocked definition and saves it globally
 * so the next lookup is instant for all users.
 *
 * @param {string} userId       - Current user's UID (for personal history)
 * @param {string} notebookId   - Current notebook ID (for personal history)
 * @param {string} term         - The highlighted term
 * @param {string} language     - Target language (default: "cebuano")
 * @returns {object}            - Definition data matching DefinitionResponse shape
 */
export const getExplanation = async (userId, notebookId, term, language = "cebuano", context = "") => {
  const termKey = `${term.toLowerCase().trim()}_${language.toLowerCase()}`;
  const globalDocRef = doc(db, 'global_dictionary', termKey);

  try {
    // --- STEP 1: Check the global dictionary cache first (cache hit = free) ---
    const globalDocSnap = await getDoc(globalDocRef);

    let definitionData = null;

    if (globalDocSnap.exists()) {
      console.log(`[GlobalDict] Cache hit for "${termKey}"`);
      definitionData = globalDocSnap.data();
    } else {
      console.log(`[GlobalDict] Cache miss for "${termKey}". Calling backend API.`);

      // --- STEP 2: Cache miss — call the backend /api/define endpoint ---
      const response = await fetch("http://localhost:8000/api/define", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          word: term,
          context: context || null,
          target_language: language,
          include_translation: true
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      definitionData = {
        term: data.word,
        language: language,
        translated_context: data.translated_context,
        english_definition: data.english_definition,
        confused_with: data.confused_with || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // --- STEP 3: Save to global dictionary cache ---
      await setDoc(globalDocRef, definitionData);
      console.log(`[GlobalDict] Saved definition for "${termKey}" to global_dictionary`);
    }

    // --- STEP 4: Record in the user's personal notebook dictionary history ---
    if (userId && notebookId) {
      const userDictRef = doc(db, 'users', userId, 'notebooks', notebookId, 'dictionary', termKey);
      await setDoc(userDictRef, {
        ...definitionData,
        term: term,
        language: language,
        lastAccessed: serverTimestamp(),
      }, { merge: true });
    }

    return definitionData;

  } catch (error) {
    console.error('[Dictionary API] Error fetching explanation:', error);
    return null;
  }
};

/**
 * Fetches the user's personal dictionary history for a given notebook,
 * ordered by most recently accessed.
 *
 * @param {string} userId
 * @param {string} notebookId
 * @returns {Array<string>}  - List of term strings
 */
export const getHistory = async (userId, notebookId) => {
  if (!userId || !notebookId) return [];

  try {
    const dictRef = collection(db, 'users', userId, 'notebooks', notebookId, 'dictionary');
    const q = query(dictRef, orderBy('lastAccessed', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs
      .map(doc => doc.data())
      .filter(d => d.term && !d._placeholder)  // exclude placeholders
      .map(d => d.term);

  } catch (error) {
    console.error('[GlobalDict] Error fetching history:', error);
    return [];
  }
};