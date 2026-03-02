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
export const getExplanation = async (userId, notebookId, term, language = "ceb") => {
  const termKey = term.toLowerCase().trim().replace(/\s+/g, "_");
  const langKey = language.toLowerCase();
  //const globalDocRef = doc(db, 'global_dictionary', termKey);

  const globalTranslationRef = doc(
    db,
    "global_dictionary",
    termKey,
    "translations",
    langKey
  );

  try {
    // --- STEP 1: Check the global dictionary first (cache hit = free) ---
    const globalDocSnap = await getDoc(globalTranslationRef);

    let definitionData = null;

    if (globalDocSnap.exists()) {
      console.log(`[GlobalDict] Cache hit for "${termKey}"`);
      definitionData = globalDocSnap.data();
    } else {
      console.log(`[GlobalDict] Cache miss for "${termKey}". Using mock fallback.`);

      // --- STEP 2: Fallback — TODO: Replace this mock with a real Gemini/SEA-LION API call ---
      definitionData = {
        term: term,
        language: language,
        cebuano_context: `Kini usa ka mock explanation para sa "${term}". Palihug pun-a kini og tinuod nga kahulugan.`,
        english_definition: `This is a mock definition for "${term}". A developer will replace this with a real GenAI response.`,
        confused_with: ["MockTermA", "MockTermB", "MockTermC"],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Save to global dictionary so the NEXT user gets a cache hit
      await setDoc(globalTranslationRef, definitionData);
      console.log(`[GlobalDict] Saved mock definition for "${termKey}" to global_dictionary`);
    }

    // --- STEP 3: Record in the user's personal notebook dictionary history ---
    if (userId && notebookId) {

      const wordDocRef = doc(
        db,
        "users",
        userId,
        "notebooks",
        notebookId,
        "dictionary",
        termKey
      );

      await setDoc(wordDocRef, {
        lastAccessed: serverTimestamp()
      }, { merge: true });

      const localTranslationRef = doc(
        db,
        "users",
        userId,
        "notebooks",
        notebookId,
        "dictionary",
        termKey,
        "translations",
        langKey
      );

      await setDoc(localTranslationRef, {
        ...definitionData,
        lastAccessed: serverTimestamp()
      }, { merge: true });
    }

    return definitionData;

  } catch (error) {
    console.error("Dictionary error:", error);
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
    //const q = query(dictRef, orderBy('lastAccessed', 'desc'));
    const snapshot = await getDocs(dictRef);

    return snapshot.docs
      .map(doc => doc.id)
      //.map(doc => doc.data())
      // .filter(d => d.term && !d._placeholder)  // exclude placeholders
      // .map(d => d.term);

  } catch (error) {
    console.error('[GlobalDict] Error fetching history:', error);
    return [];
  }
};