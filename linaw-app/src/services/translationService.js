import api from '../api';

/**
 * Translates text using the gateway proxy.
 * The gateway forwards the request to the Modal translator service.
 *
 * @param {string} text - The text to translate.
 * @param {string} targetLang - NLLB language code (e.g. 'tgl_Latn', 'ceb_Latn').
 * @param {string} provider - Which translation engine to use ('nllb', 'google', etc.).
 * @returns {Promise<string>} The translated text.
 */
export const translateText = async (text, targetLang = 'tgl_Latn', provider = 'nllb') => {
    const response = await api.post('/api/translate', {
        text,
        target_lang: targetLang,
        provider
    });
    return response.data.translated_text;
};
