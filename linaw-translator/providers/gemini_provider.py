import os
from .base import TranslationProvider

# Map NLLB codes to human-readable language names for the Gemini prompt
LANG_NAMES = {
    "tgl_Latn": "Tagalog",
    "ceb_Latn": "Cebuano",
    "hil_Latn": "Hiligaynon",
    "bcl_Latn": "Bikol",
}

class GeminiProvider(TranslationProvider):
    async def translate(self, text: str, target_lang: str) -> str:
        from google import genai

        client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

        lang_name = LANG_NAMES.get(target_lang, target_lang)

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=f"Translate the following text to {lang_name}. Return only the translation, nothing else.\n\n{text}",
        )

        return response.text.strip()
