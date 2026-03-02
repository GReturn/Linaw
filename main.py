from pathlib import Path

from google import genai
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from fastapi import UploadFile, File, Form
import uuid
from fastapi.staticfiles import StaticFiles
import os

env_path = Path('.') / 'linaw-app' / '.env'
load_dotenv(dotenv_path=env_path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
client = genai.Client(api_key=GEMINI_API_KEY)


app = FastAPI()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Added both variants
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

class DefinitionResponse(BaseModel):
    word: str
    cebuano_context: str
    english_definition: str
    confused_with: List[str]

class NotebookRequest(BaseModel):
    id: str
    title: str
    file: str

class AddToHistoryRequest(BaseModel):
    word: str

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
    file_location = os.path.join(UPLOAD_DIR, unique_filename)

    content = await file.read()
    with open(file_location, "wb") as f:
        f.write(content)

    return {
    "fileName": file.filename,
    "fileURL": f"http://localhost:8000/uploads/{unique_filename}"
}



USE_MOCK = True  # Set to False when you actually want to use Gemini

@app.post("/api/define")
async def define_word(request: DefinitionRequest):

    if USE_MOCK:
        return DefinitionResponse(
            word=request.word,
            cebuano_context=f"Kini usa ka mock explanation para sa {request.word} para dili mahurot ang imong quota.",
            english_definition=f"This is a mock definition for {request.word} to save your API credits.",
            confused_with=["Mock1", "Mock2", "Mock3"]
        )
    # Prompting for raw strings to fit your existing fields
    prompt = f"""
    Explain the word "{request.word}".
    Provide exactly two paragraphs:
    1. A translation and explanation in Cebuano (Bisaya) with a sample sentence.
    2. A formal English definition.
    Then, list 3 words often confused with it, separated by commas.
    Separate these three sections with '---'.
    """

    try:
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt,
        )

        # Split the raw string back into the parts your return statement needs
        raw_output = response.text
        parts = raw_output.split("---")

        # Extracting strings or providing fallbacks to keep the backend stable
        cebuano = parts[0].strip() if len(parts) > 0 else "Walay hubad."
        english = parts[1].strip() if len(parts) > 1 else "No definition."
        confused = [w.strip() for w in parts[2].split(",")] if len(parts) > 2 else []

        return DefinitionResponse(
            word=request.word,
            cebuano_context=cebuano,
            english_definition=english,
            confused_with=confused
        )

    except Exception as e:
        # If the API fails, we still return the structure so the frontend doesn't break
        return DefinitionResponse(
            word=request.word,
            cebuano_context="Sayop sa pagkonektar sa AI.",
            english_definition=f"Error: {str(e)}",
            confused_with=[]
        )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)