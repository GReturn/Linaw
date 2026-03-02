import firebase_admin
from firebase_admin import credentials, firestore, storage

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    "storageBucket": "linaw-b46e4.firebasestorage.app"
})

db = firestore.client()
bucket = storage.bucket()