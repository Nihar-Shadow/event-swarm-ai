import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_participants():
    print("\n--- Testing participants_uploaded ---")
    url = f"{BASE_URL}/upload-participants"
    files = {'file': ('test.csv', 'name,email\nJohn,john@test.com')}
    res = requests.post(url, files=files)
    print(res.status_code)

def test_event():
    print("\n--- Testing event_created ---")
    url = f"{BASE_URL}/generate-social-content"
    data = {
        "eventName": "Swarm Launch",
        "theme": "AI Agents",
        "date": "2026-04-01",
        "location": "Global",
        "description": "Launching the swarm"
    }
    res = requests.post(url, json=data)
    print(res.status_code)

def test_schedule():
    print("\n--- Testing schedule_updated ---")
    url = f"{BASE_URL}/auto-schedule"
    # To trigger conflicts, we provide two sessions at the same time in same room
    data = {
        "sessions": [
            {"id": "1", "title": "Talk A", "preferred_time": "10:00", "duration": 60, "speaker_id": "sp1", "room_id": "rm1"},
            {"id": "2", "title": "Talk B", "preferred_time": "10:00", "duration": 60, "speaker_id": "sp2", "room_id": "rm1"}
        ],
        "rooms": [{"id": "rm1", "name": "Room 1", "capacity": 50}],
        "event_date": "2026-03-15",
        "event_start_hour": "09:00",
        "event_end_hour": "18:00"
    }
    res = requests.post(url, json=data)
    print(res.status_code)

if __name__ == "__main__":
    test_participants()
    test_event()
    test_schedule()
