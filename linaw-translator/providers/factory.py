from .nllb_provider import NLLBProvider
from .gemini_provider import GeminiProvider

def get_provider(provider_name: str):
    providers = {
        "nllb": NLLBProvider(),
        "gemini": GeminiProvider(),
    }
    return providers.get(provider_name.lower(), providers["nllb"])
