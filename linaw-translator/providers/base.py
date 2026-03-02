from abc import ABC, abstractmethod

class TranslationProvider(ABC):
    @abstractmethod
    async def translate(self, text: str, target_lang: str) -> str:
        """Translates text to the target language."""
        pass
