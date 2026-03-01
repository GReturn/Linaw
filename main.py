import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from fastapi import UploadFile, File, Form
import uuid
from fastapi.staticfiles import StaticFiles
import os

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

@app.post("/api/define")
async def define_word(request: DefinitionRequest):
    # Mock response - replace with actual AI/API call
    return DefinitionResponse(
        word=request.word,
        cebuano_context=f"At vero eos et accusamus et {request.word} odio dignissimos ducimus qui blanditiis praesentium...",
        english_definition=f"The standard English definition and context for {request.word} will be displayed here from the global dictionary.",
        confused_with=["Accusamus", "Ducimus", "Blanditiis"]
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)