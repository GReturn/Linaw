from .base import TranslationProvider

class NLLBProvider(TranslationProvider):
    async def translate(self, text: str, target_lang: str) -> str:
        # Import the Modal class from the main app
        from main import Translator 
        
        # Trigger Modal remote inference
        translator_instance = Translator()
        return translator_instance.translate.remote(text, target_lang=target_lang)
