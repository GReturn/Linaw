import os
from pathlib import Path
from firebase_config import db, bucket
from google.cloud.firestore import SERVER_TIMESTAMP
from google import genai
import httpx
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from fastapi import UploadFile, File, Form
import uuid
from fastapi.staticfiles import StaticFiles
import os

env_path = Path('.') / 'linaw-app' / '.env'
load_dotenv(dotenv_path=env_path)

client = genai.Client()

TRANSLATOR_URL = "https://spongebobrafael--linaw-translator-fastapi-app.modal.run"

app = FastAPI()

# Configure CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
frontend_url = os.environ.get("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage (replace with database in production)
history_store = ["Accusantium", "Dignissimos", "Blanditiis", "Praesentium"]  # Initialize with mock data
confusion_terms_store = ["Accusamus", "Ducimus", "Blanditiis"]

# Pydantic models
class DefinitionRequest(BaseModel):
    word: str
    context: Optional[str] = None
    include_translation: bool = True
    target_language: str = "Cebuano (Bisaya)"

class DefinitionResponse(BaseModel):
    word: str
    translated_context: str
    english_definition: str
    confused_with: List[str]

class NotebookRequest(BaseModel):
    id: str
    title: str
    file: str

class AddToHistoryRequest(BaseModel):
    word: str

class TranslateProxyRequest(BaseModel):
    text: str
    target_lang: str = "tgl_Latn"
    provider: str = "nllb"

# --- Progressive loading models ---
class DefinitionOnlyRequest(BaseModel):
    word: str
    context: Optional[str] = None
    target_language: str = "Cebuano (CEB)"

class DefinitionOnlyResponse(BaseModel):
    word: str
    english_definition: str
    confused_with: List[str]

class TranslateDefinitionRequest(BaseModel):
    word: str
    english_definition: str
    target_language: str = "Cebuano (CEB)"

class TranslateDefinitionResponse(BaseModel):
    translated_context: str

@app.get("/")
async def root():
    return {"message": "Welcome to Linaw API"}

@app.get("/api/notebook/{notebook_id}")
async def get_notebook(notebook_id: str):
    # Mock data - replace with actual database lookup
    notebooks = {
        "1": {"title": "Linaw", "file": "/2025.nllp-1.3.pdf"}
    }
    return notebooks.get(notebook_id, {"title": "Unknown", "file": ""})

@app.get("/api/history")
async def get_history():
    # Return the in-memory history store
    return history_store

@app.post("/api/history/add")
async def add_to_history(request: AddToHistoryRequest):
    # Add word to history if it doesn't already exist (at the beginning)
    if request.word in history_store:
        # Move to front if it exists
        history_store.remove(request.word)
    # Add to beginning of list
    history_store.insert(0, request.word)
    # Keep only last 20 items
    while len(history_store) > 20:
        history_store.pop()
    return {"message": "Added to history", "history": history_store}

@app.get("/api/confusion-terms")
async def get_confusion_terms():
    # Return the in-memory confusion terms store
    return confusion_terms_store

@app.post("/sources/upload")
async def upload_source(
    notebook_id: str = Form(...),
    user_id: str = Form(...),
    file: UploadFile = File(...)
):
    unique_filename = f"{uuid.uuid4()}_{file.filename}"
    print("Uploading to Firebase Storage now...")
    blob = bucket.blob(f"users/{user_id}/notebooks/{notebook_id}/{unique_filename}")

    content = await file.read()
    blob.upload_from_string(content, content_type="application/pdf")

    blob.make_public()

    file_url = blob.public_url

    doc_ref = db.collection("users") \
        .document(user_id) \
        .collection("notebooks") \
        .document(notebook_id) \
        .collection("documents") \
        .document()

    doc_ref.set({
        "fileName": file.filename,
        "fileURL": file_url,
        "createdAt": SERVER_TIMESTAMP
    })

    return {
        "message": "Upload successful",
        "fileName": file.filename,
        "fileURL": file_url
    }

USE_MOCK = False  # Set to False when you actually want to use Gemini

CACHE_VERSION = "v3"  # Bump this to invalidate old stale cache entries

@app.post("/api/define")
async def define_word(request: DefinitionRequest):

    word_key = request.word.lower().strip()

    # Short-circuit immediately when mock mode is on — skip Firestore entirely
    if USE_MOCK:
        return DefinitionResponse(
            word=request.word,
            translated_context=f"Kini usa ka mock explanation para sa {request.word} para dili mahurot ang imong quota.",
            english_definition=f"This is a mock definition for {request.word} to save your API credits.",
            confused_with=["Mock1", "Mock2", "Mock3"]
        )

    lang_map = {
        "Tagalog (TGL)": "tgl",
        "Cebuano (CEB)": "ceb",
        "Waray (WAR)": "war",
        "Ilocano (ILO)": "ilo",
        "Pangasinense (PAG)": "pag",
        "Hiligaynon (HIL)": "hil",
        "Bikolano (BIK)": "bik"
    }

    # Default to ceb if not found, or None if "None (EN)"
    lang_code = lang_map.get(request.target_language)
    
    if lang_code:
        translation_ref = (
            db.collection("global_dictionary")
            .document(word_key)
            .collection("translations")
            .document(lang_code)
        )
        cached_doc = translation_ref.get()
    else:
        cached_doc = None
        translation_ref = None

    # Check global dict cache — only use if it has the current cache version
    if cached_doc and cached_doc.exists:
        data = cached_doc.to_dict()
        if data.get("cache_version") == CACHE_VERSION:
            return DefinitionResponse(
                word=word_key,
                translated_context=data.get("translated_context", ""),
                english_definition=data.get("english_definition", "No definition."),
                confused_with=data.get("confused_with", [])
            )

    # Map UI language to NLLB codes for the translator service
    nllb_lang_map = {
        "Tagalog (TGL)": "tgl_Latn",
        "Cebuano (CEB)": "ceb_Latn",
        "Waray (WAR)": "war_Latn",
        "Ilocano (ILO)": "ilo_Latn",
        "Pangasinense (PAG)": "pag_Latn",
        "Hiligaynon (HIL)": "hil_Latn",
        "Bikolano (BIK)": "bcl_Latn"
    }

    context_instruction = ""
    if request.context:
        context_instruction = f'\nThe word appears in this context: "{request.context}"\nUse this context to provide a definition specific to how the word is used here.\n'

    prompt = f"""
You are a dictionary assistant. For the word or phrase "{request.word}":
{context_instruction}
Provide a formal English definition in exactly one paragraph.
Then, provide exactly 3 words or phrases often confused with it, separated by commas only.

CRITICAL: Format your output as exactly two parts separated by three hyphens "---" on a new line. Do NOT output any headings like "SECTION 1".
Example format:
This is the definition paragraph.
---
Word1, Word2, Word3
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        # Split the raw string back into the parts
        raw_output = response.text
        parts = raw_output.split("---")

        english = parts[0].strip() if len(parts) > 0 else "No definition."
        confused = [w.strip() for w in parts[1].split(",")] if len(parts) > 1 else []

        # Translate the English definition via the Modal translator API
        target_lang_context = ""
        if request.include_translation:
            nllb_code = nllb_lang_map.get(request.target_language)
            if nllb_code:
                try:
                    async with httpx.AsyncClient() as http_client:
                        resp = await http_client.post(
                            f"{TRANSLATOR_URL}/translate",
                            json={"text": english, "target_lang": nllb_code, "provider": "nllb"},
                            timeout=120.0  # Long timeout to handle Gemini→NLLB fallback cold starts
                        )
                        resp.raise_for_status()
                        target_lang_context = resp.json().get("translated_text", "")
                except Exception as translate_err:
                    print(f"Translation failed ({type(translate_err).__name__}), skipping: {translate_err}")

        if translation_ref:
            translation_ref.set({
                "translated_context": target_lang_context,
                "english_definition": english,
                "confused_with": confused,
                "cache_version": CACHE_VERSION,
                "createdAt": SERVER_TIMESTAMP
            })

        return DefinitionResponse(
            word=request.word,
            translated_context=target_lang_context,
            english_definition=english,
            confused_with=confused
        )

    except Exception as e:
        return DefinitionResponse(
            word=request.word,
            translated_context="",
            english_definition=f"Error: {str(e)}",
            confused_with=[]
        )


# Progressive loading endpoints

@app.post("/api/define-only")
async def define_word_only(request: DefinitionOnlyRequest):
    """Phase 1: Returns English definition + confused-with terms immediately (no translation)."""
    word_key = request.word.lower().strip()

    if USE_MOCK:
        return DefinitionOnlyResponse(
            word=request.word,
            english_definition=f"This is a mock definition for {request.word} to save your API credits.",
            confused_with=["Mock1", "Mock2", "Mock3"]
        )

    lang_map = {
        "Tagalog (TGL)": "tgl",
        "Cebuano (CEB)": "ceb",
        "Waray (WAR)": "war",
        "Ilocano (ILO)": "ilo",
        "Pangasinense (PAG)": "pag",
        "Hiligaynon (HIL)": "hil",
        "Bikolano (BIK)": "bik"
    }
    lang_code = lang_map.get(request.target_language)

    # Check cache — if full entry exists, return definition part only
    if lang_code:
        translation_ref = (
            db.collection("global_dictionary")
            .document(word_key)
            .collection("translations")
            .document(lang_code)
        )
        cached_doc = translation_ref.get()
        if cached_doc.exists:
            data = cached_doc.to_dict()
            if data.get("cache_version") == CACHE_VERSION:
                return DefinitionOnlyResponse(
                    word=word_key,
                    english_definition=data.get("english_definition", "No definition."),
                    confused_with=data.get("confused_with", [])
                )

    context_instruction = ""
    if request.context:
        context_instruction = f'\nThe word appears in this context: "{request.context}"\nUse this context to provide a definition specific to how the word is used here.\n'

    prompt = f"""
You are a dictionary assistant. For the word or phrase "{request.word}":
{context_instruction}
Provide a formal English definition in exactly one paragraph.
Then, provide exactly 3 words or phrases often confused with it, separated by commas only.

CRITICAL: Format your output as exactly two parts separated by three hyphens "---" on a new line. Do NOT output any headings like "SECTION 1".
Example format:
This is the definition paragraph.
---
Word1, Word2, Word3
"""

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )

        raw_output = response.text
        parts = raw_output.split("---")
        english = parts[0].strip() if len(parts) > 0 else "No definition."
        confused = [w.strip() for w in parts[1].split(",")] if len(parts) > 1 else []

        # Cache the definition part (translation will be added later)
        if lang_code:
            translation_ref = (
                db.collection("global_dictionary")
                .document(word_key)
                .collection("translations")
                .document(lang_code)
            )
            translation_ref.set({
                "english_definition": english,
                "confused_with": confused,
                "translated_context": "",  # placeholder for Phase 2
                "cache_version": CACHE_VERSION,
                "createdAt": SERVER_TIMESTAMP
            })

        return DefinitionOnlyResponse(
            word=request.word,
            english_definition=english,
            confused_with=confused
        )

    except Exception as e:
        return DefinitionOnlyResponse(
            word=request.word,
            english_definition=f"Error: {str(e)}",
            confused_with=[]
        )


@app.post("/api/translate-definition")
async def translate_definition(request: TranslateDefinitionRequest):
    """Phase 2: Translates the English definition to the target language."""
    word_key = request.word.lower().strip()

    nllb_lang_map = {
        "Tagalog (TGL)": "tgl_Latn",
        "Cebuano (CEB)": "ceb_Latn",
        "Waray (WAR)": "war_Latn",
        "Ilocano (ILO)": "ilo_Latn",
        "Pangasinense (PAG)": "pag_Latn",
        "Hiligaynon (HIL)": "hil_Latn",
        "Bikolano (BIK)": "bcl_Latn"
    }

    lang_map = {
        "Tagalog (TGL)": "tgl",
        "Cebuano (CEB)": "ceb",
        "Waray (WAR)": "war",
        "Ilocano (ILO)": "ilo",
        "Pangasinense (PAG)": "pag",
        "Hiligaynon (HIL)": "hil",
        "Bikolano (BIK)": "bik"
    }

    lang_code = lang_map.get(request.target_language)

    # Check cache — if translation already exists, return it
    if lang_code:
        translation_ref = (
            db.collection("global_dictionary")
            .document(word_key)
            .collection("translations")
            .document(lang_code)
        )
        cached_doc = translation_ref.get()
        if cached_doc.exists:
            data = cached_doc.to_dict()
            if data.get("cache_version") == CACHE_VERSION and data.get("translated_context"):
                return TranslateDefinitionResponse(
                    translated_context=data["translated_context"]
                )

    nllb_code = nllb_lang_map.get(request.target_language)
    if not nllb_code:
        return TranslateDefinitionResponse(translated_context="")

    try:
        async with httpx.AsyncClient() as http_client:
            resp = await http_client.post(
                f"{TRANSLATOR_URL}/translate",
                json={"text": request.english_definition, "target_lang": nllb_code, "provider": "nllb"},
                timeout=120.0
            )
            resp.raise_for_status()
            translated_text = resp.json().get("translated_text", "")

        # Update cache with translation
        if lang_code:
            translation_ref = (
                db.collection("global_dictionary")
                .document(word_key)
                .collection("translations")
                .document(lang_code)
            )
            translation_ref.set({
                "translated_context": translated_text,
                "english_definition": request.english_definition,
                "cache_version": CACHE_VERSION,
                "updatedAt": SERVER_TIMESTAMP
            }, merge=True)

        return TranslateDefinitionResponse(translated_context=translated_text)

    except Exception as e:
        print(f"Translation failed ({type(e).__name__}): {e}")
        return TranslateDefinitionResponse(translated_context="")


@app.post("/api/translate")
async def translate_proxy(request: TranslateProxyRequest):
    """Proxies translation requests to the Modal translator service."""
    try:
        # Map UI dropdown format to NLLB format
        lang_map = {
            "Tagalog (TGL)": "tgl_Latn",
            "Cebuano (CEB)": "ceb_Latn",
            "Waray (WAR)": "war_Latn",
            "Ilocano (ILO)": "ilo_Latn",
            "Pangasinense (PAG)": "pag_Latn",
            "Hiligaynon (HIL)": "hil_Latn",
            "Bikolano (BIK)": "bcl_Latn"
        }
        
        target_lang = lang_map.get(request.target_lang, request.target_lang)
        payload = request.model_dump()
        payload["target_lang"] = target_lang

        async with httpx.AsyncClient() as http_client:
            resp = await http_client.post(
                f"{TRANSLATOR_URL}/translate",
                json=payload,
                timeout=30.0
            )
            resp.raise_for_status()
        return resp.json()
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail="Translation service error")
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Translation service unavailable")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)