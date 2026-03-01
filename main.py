import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Added both variants
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    # Mock data - replace with actual database query
    return ["Accusantium", "Dignissimos", "Blanditiis", "Praesentium"]

@app.get("/api/confusion-terms")
async def get_confusion_terms():
    # Mock data - replace with actual database query
    return ["Accusamus", "Ducimus", "Blanditiis"]

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