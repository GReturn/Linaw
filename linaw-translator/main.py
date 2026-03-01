import os
import torch
import modal
from fastapi import FastAPI
from pydantic import BaseModel

app = modal.App("linaw-translator")

# Helper function to run inside the Modal image build step
def download_models():
    """Downloads models during image build to cache them on Modal's end."""
    import nltk
    from transformers import AutoTokenizer
    import ctranslate2
    
    # Download NLTK tokenizers
    nltk.download('punkt', quiet=True)
    nltk.download('punkt_tab', quiet=True)
    
    # Download and convert model - this caches it in the image
    model_name = "facebook/nllb-200-distilled-1.3B"
    ct2_output_dir = "/model_cache/nllb-1.3B-ct2-int8"
    
    # Only convert if it doesn't already exist in the image cache
    if not os.path.exists(ct2_output_dir):
        print("Downloading and converting NLLB model...")
        converter = ctranslate2.converters.TransformersConverter(
            model_name_or_path=model_name,
            load_as_float16=True,
            low_cpu_mem_usage=True
        )
        converter.convert(
            output_dir=ct2_output_dir, 
            quantization="int8_float16", # Keep it fast and small on GPU
            force=True 
        )
    
    # Download tokenizer so it's cached
    AutoTokenizer.from_pretrained(model_name, src_lang="eng_Latn")

# Define our Modal environment (the "Docker" container)
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "fastapi",
        "ctranslate2",
        "transformers",
        "torch",
        "pydantic",
        "nltk",
        "hf-transfer", # Faster HuggingFace downloads
        "accelerate"
    )
    .env({"HF_HUB_ENABLE_HF_TRANSFER": "1"}) # Enable fast downloads
    .run_function(download_models) # Trigger the downloads at build time!
)

# Create a FastAPI instance
web_app = FastAPI(title="Linaw Translator API", version="1.0.0")

class TranslationRequest(BaseModel):
    text: str
    target_lang: str = "tgl_Latn"

class TranslationResponse(BaseModel):
    translated_text: str

# This class will boot up ONCE per container lifecycle
@app.cls(image=image, gpu="A10G", container_idle_timeout=60, allow_concurrent_inputs=10)
class Translator:
    @modal.enter()
    def load_model(self):
        """Loads model into GPU memory once the container starts."""
        import ctranslate2
        from transformers import AutoTokenizer
        
        print("Loading Tokenizer and CTranslate2 Engine into GPU...")
        self.ct2_model_path = "/model_cache/nllb-1.3B-ct2-int8"
        self.model_name = "facebook/nllb-200-distilled-1.3B"
        
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name, src_lang="eng_Latn")
        self.translator = ctranslate2.Translator(self.ct2_model_path, device="cuda")
        print("Model loaded successfully!")

    @modal.method()
    def translate(self, text: str, target_lang: str = "tgl_Latn") -> str:
        """The actual inference logic."""
        import nltk
        
        # 1. Split text into individual sentences
        sentences = nltk.tokenize.sent_tokenize(text)
        if not sentences:
            return ""
            
        # 2. Tokenize all sentences for CT2
        source_tokens = [self.tokenizer.convert_ids_to_tokens(self.tokenizer.encode(sent)) for sent in sentences]
        target_prefix = [[target_lang]] * len(sentences)
        
        # 3. Translate the batch
        results = self.translator.translate_batch(
            source_tokens, 
            target_prefix=target_prefix,
            beam_size=1,                  
            repetition_penalty=1.1,       
            max_decoding_length=200
        )
        
        # 4. Decode
        translated_text = ""
        for result in results:
            tokens = result.hypotheses[0][1:]
            text_chunk = self.tokenizer.decode(self.tokenizer.convert_tokens_to_ids(tokens), skip_special_tokens=True)
            text_chunk = text_chunk.replace("<unk>", "").strip() 
            translated_text += text_chunk + " "
            
        return translated_text.strip()

# Hook the FastAPI endpoints to the Modal Class
@web_app.post("/translate", response_model=TranslationResponse)
async def translate_endpoint(request: TranslationRequest):
    """
    Translates text by calling the Modal Translator class.
    """
    # Instantiate the modal class to trigger inference
    # Modal handles routing this to a hot container if available
    translator_instance = Translator()
    result = translator_instance.translate.remote(request.text, target_lang=request.target_lang)
    return TranslationResponse(translated_text=result)

@web_app.get("/health")
async def health_check():
    return {"status": "ok"}

# Expose the FastAPI app to the internet via Modal
@app.function(image=image)
@modal.asgi_app()
def fastapi_app():
    return web_app
