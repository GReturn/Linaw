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

      // Save to global dictionary so the NEXT user gets a cache hit
      await setDoc(globalTranslationRef, definitionData);
      console.log(`[GlobalDict] Saved mock definition for "${termKey}" to global_dictionary`);
    }

    // --- STEP 4: Record in the user's personal notebook dictionary history ---
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

// ─── Progressive loading: Phase 1 (definition only, fast) ─────────────────────

/**
 * Phase 1: Fetches English definition + confused-with terms only.
 * Checks Firestore cache first, then falls back to /api/define-only.
 * Also records the lookup in the user's personal notebook dictionary.
 */
export const getDefinitionOnly = async (userId, notebookId, term, language = "cebuano", context = "") => {
  const termKey = `${term.toLowerCase().trim()}_${language.toLowerCase()}`;
  const globalDocRef = doc(db, 'global_dictionary', termKey);

  try {
    // Check global dictionary cache for a definition-only hit
    const globalDocSnap = await getDoc(globalDocRef);

    if (globalDocSnap.exists()) {
      const cachedData = globalDocSnap.data();
      if (cachedData.english_definition) {
        console.log(`[GlobalDict] Definition cache hit for "${termKey}"`);

        // Record personal history
        if (userId && notebookId) {
          const userDictRef = doc(db, 'users', userId, 'notebooks', notebookId, 'dictionary', termKey);
          await setDoc(userDictRef, {
            term, language,
            english_definition: cachedData.english_definition,
            confused_with: cachedData.confused_with || [],
            lastAccessed: serverTimestamp(),
          }, { merge: true });
        }

        return {
          term,
          language,
          english_definition: cachedData.english_definition,
          confused_with: cachedData.confused_with || [],
          // Pass along any already-cached translation
          translated_context: cachedData.translated_context || "",
        };
      }
    }

    // Cache miss — call the fast define-only endpoint
    console.log(`[GlobalDict] Definition cache miss for "${termKey}". Calling /api/define-only.`);
    const response = await fetch("http://localhost:8000/api/define-only", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        word: term,
        context: context || null,
        target_language: language,
      })
    });

    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    const data = await response.json();

    const definitionData = {
      term: data.word,
      language,
      english_definition: data.english_definition,
      confused_with: data.confused_with || [],
      translated_context: "",  // not yet available
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Save to global cache
    await setDoc(globalDocRef, definitionData, { merge: true });

    // Record personal history
    if (userId && notebookId) {
      const userDictRef = doc(db, 'users', userId, 'notebooks', notebookId, 'dictionary', termKey);
      await setDoc(userDictRef, {
        ...definitionData,
        lastAccessed: serverTimestamp(),
      }, { merge: true });
    }

    return definitionData;

  } catch (error) {
    console.error('[Dictionary API] Error fetching definition only:', error);
    return null;
  }
};

// ─── Progressive loading: Phase 2 (translation, slow) ─────────────────────────

/**
 * Phase 2: Translates an English definition to the target language.
 * Checks Firestore cache first, then falls back to /api/translate-definition.
 */
export const getTranslation = async (term, englishDefinition, language = "cebuano") => {
  const termKey = `${term.toLowerCase().trim()}_${language.toLowerCase()}`;
  const globalDocRef = doc(db, 'global_dictionary', termKey);

  try {
    // Check if translation is already cached
    const globalDocSnap = await getDoc(globalDocRef);
    if (globalDocSnap.exists()) {
      const cachedData = globalDocSnap.data();
      if (cachedData.translated_context) {
        console.log(`[GlobalDict] Translation cache hit for "${termKey}"`);
        return { translated_context: cachedData.translated_context };
      }
    }

    // Cache miss — call the translation endpoint
    console.log(`[GlobalDict] Translation cache miss for "${termKey}". Calling /api/translate-definition.`);
    const response = await fetch("http://localhost:8000/api/translate-definition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        word: term,
        english_definition: englishDefinition,
        target_language: language,
      })
    });

    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    const data = await response.json();

    // Update cache with the translation
    if (data.translated_context) {
      await setDoc(globalDocRef, {
        translated_context: data.translated_context,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }

    return { translated_context: data.translated_context || "" };

  } catch (error) {
    console.error('[Dictionary API] Error fetching translation:', error);
    return { translated_context: "" };
  }
};