from fastapi.testclient import TestClient
from main import web_app

client = TestClient(web_app)

def test_google_provider_routing():
    response = client.post(
        "/translate",
        json={"text": "Hello world", "target_lang": "tgl_Latn", "provider": "google"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "Google API Simulation" in data["translated_text"]
    print("Google Provider Routing Test: SUCCESS")

if __name__ == "__main__":
    test_google_provider_routing()
