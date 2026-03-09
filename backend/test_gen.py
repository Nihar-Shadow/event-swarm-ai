
import requests
import json

url = "http://localhost:8000/api/generate-social-content"
payload = {
    "eventName": "Antigravity Dev Summit",
    "theme": "Neon Future",
    "date": "2026-05-20",
    "location": "Virtual Space",
    "description": "A deep dive into agentic coding and AI tool use."
}

try:
    print("Testing content generation...")
    response = requests.post(url, json=payload, timeout=70)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print("Success!")
        print(f"Image URL starts with: {data.get('image_url', '')[:100]}...")
        if data.get('image_url', '').startswith('data:image'):
            print("Detected Base64 image.")
        else:
            print("Detected external URL.")
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Failed to connect: {e}")
