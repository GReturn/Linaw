// src/services/dictionaryService.js
import { db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export const getExplanation = async (userId, notebookId, term, language = "cebuano") => {
  const termKey = `${term.toLowerCase()}_${language.toLowerCase()}`;
  const globalDocRef = doc(db, 'global_dictionary', termKey);

  try {
    // check global dictionary (saves cost)
    const globalDocSnap = await getDoc(globalDocRef);

    let dictionaryData = null;

    if (globalDocSnap.exists()) {
      console.log("Found in Global Dictionary!");
      dictionaryData = globalDocSnap.data();
    } else {
      console.log("Not found globally. Calling SEA-LION LLM...");
      
      // fallback: call LLM API here
      // const response = await callSeaLionAPI(term, language);
      
      // mocking the LLM response for now:
      dictionaryData = {
        term: term,
        language: language,
        simple_definition: "Mock Cebuano definition here...",
        advanced_definition: "Mock English definition...",
        example: "Sample sentence...",
        image_url: "https://example.com/image.png",
        image_source: "Wikimedia",
        attribution: "CC BY 4.0",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // save to global dictionary for the next person
      await setDoc(globalDocRef, dictionaryData);
    }

    // save to the specific User's personal dictionary history
    if (userId && notebookId) {
      const userDictRef = doc(db, 'users', userId, 'notebooks', notebookId, 'dictionary', termKey);
      await setDoc(userDictRef, {
        ...dictionaryData,
        lastAccessed: serverTimestamp()
      }, { merge: true });
    }

    return dictionaryData;

  } catch (error) {
    console.error("Error fetching explanation:", error);
    return null;
  }
};