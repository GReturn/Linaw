from .nllb_provider import NLLBProvider
from .google_provider import GoogleProvider

def get_provider(provider_name: str):
    providers = {
        "nllb": NLLBProvider(),
        "google": GoogleProvider(),
    }
    return providers.get(provider_name.lower(), providers["nllb"])
