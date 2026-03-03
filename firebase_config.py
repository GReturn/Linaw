import os
import json
import firebase_admin
from firebase_admin import credentials, firestore, storage

if 'FIREBASE_SERVICE_ACCOUNT' in os.environ:
    cert_dict = json.loads(os.environ['FIREBASE_SERVICE_ACCOUNT'])
    cred = credentials.Certificate(cert_dict)
else:
    cred = credentials.Certificate("serviceAccountKey.json")

firebase_admin.initialize_app(cred, {
    "storageBucket": "linaw-b46e4.firebasestorage.app"
})

db = firestore.client()
bucket = storage.bucket()