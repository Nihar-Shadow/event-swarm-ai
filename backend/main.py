
import os
import asyncio
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Body, File, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from apscheduler.schedulers.background import BackgroundScheduler
from dotenv import load_dotenv
import requests
from swarm_controller import swarm_controller
from swarm_memory import update_memory, get_memory, get_full_memory
import ollama
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import UploadFile, File
import pandas as pd
import io

load_dotenv()

app = FastAPI(title="Social Media Content Agent API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase configuration
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Scheduler
scheduler = BackgroundScheduler()
scheduler.start()

class EventData(BaseModel):
    eventName: str
    theme: str
    date: str
    location: str
    description: str

class PostData(BaseModel):
    platform: str
    caption: str
    image_url: str
    scheduled_time: str

class PostNowData(BaseModel):
    platform: str
    caption: str
    image_url: str

class Participant(BaseModel):
    name: str
    email: str
    team_name: Optional[str] = ""
    college: Optional[str] = ""

class EmailTemplate(BaseModel):
    eventName: str
    subjectTemplate: str
    bodyTemplate: str
    participants: Optional[List[dict]] = None

# In-memory storage
participants_storage = []
local_email_logs = []

# Local storage fallback
local_logs = []
local_posts = []

# Real-time Swarm Event Queue & Broadcasting
swarm_event_queue = asyncio.Queue()
active_websockets: List[WebSocket] = []

async def broadcast_worker():
    """Background task to broadcast events from the queue to all connected clients."""
    while True:
        event = await swarm_event_queue.get()
        disconnected = []
        for ws in active_websockets:
            try:
                await ws.send_json(event)
            except Exception:
                disconnected.append(ws)
        
        for ws in disconnected:
            if ws in active_websockets:
                active_websockets.remove(ws)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(broadcast_worker())

@app.websocket("/ws/swarm")
async def swarm_socket(websocket: WebSocket):
    await websocket.accept()
    active_websockets.append(websocket)
    try:
        while True:
            # Keep the connection open
            await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in active_websockets:
            active_websockets.remove(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        if websocket in active_websockets:
            active_websockets.remove(websocket)

async def log_swarm_event(agent: str, event: str, message: str, memory_update: dict = None):
    """Broadcast an event to all connected WebSocket clients."""
    data = {
        "agent": agent,
        "event": event,
        "message": message,
        "timestamp": datetime.now().isoformat()
    }
    if memory_update:
        data["memory_update"] = memory_update
    
    swarm_event_queue.put_nowait(data)
    
    # Also log to activity feed in memory for persistence/polling fallback
    try:
        from swarm_memory import log_activity_feed
        log_activity_feed(agent, message)
    except ImportError:
        pass

def log_swarm_event_sync(agent: str, event: str, message: str, memory_update: dict = None):
    """Synchronous wrapper for log_swarm_event."""
    data = {
        "agent": agent,
        "event": event,
        "message": message,
        "timestamp": datetime.now().isoformat()
    }
    if memory_update:
        data["memory_update"] = memory_update
    
    swarm_event_queue.put_nowait(data)
    
    # Also log to activity feed
    try:
        from swarm_memory import log_activity_feed
        log_activity_feed(agent, message)
    except ImportError:
        pass

async def log_activity(action: str, platform: Optional[str] = None):
    log_entry = {
        "action": action,
        "platform": platform,
        "timestamp": datetime.now().isoformat()
    }
    print(f"[AGENT] {action}")
    local_logs.insert(0, log_entry) # Keep latest at top
    
    try:
        supabase.table("agent_logs").insert(log_entry).execute()
    except Exception:
        pass 

def publish_to_social_media(post_id: str, platform: str, caption: str):
    """Placeholder for real social media publishing"""
    print(f"Publishing to {platform}: {caption}")
    try:
        supabase.table("generated_posts").update({"status": "published"}).eq("id", post_id).execute()
    except Exception:
        pass
    asyncio.run(log_activity(f"Published post to {platform}", platform))

@app.post("/api/generate-social-content")
async def generate_content(data: EventData):
    swarm_controller("event_created", data.dict())
    await log_activity(f"Started generating content for {data.eventName}")
    
    try:
        platforms = ["LinkedIn", "Twitter/X", "Instagram"]
        results = []
        
        # 1. Generate captions using Ollama
        prompt = f"""
        Act as a professional Social Media Copywriter. Create 3 LONG-FORM, high-value posts for:
        
        EVENT: {data.eventName}
        THEME: {data.theme}
        DATE: {data.date}
        LOCATION: {data.location}
        DESCRIPTION: {data.description}
        
        STRICT FORMATTING RULES:
        1. LinkedIn: 500+ words. Professional tone. Include Hook, Story, Key Takeaways, Logistics, and CTA.
        2. Instagram: 300+ words. Story-driven. Detailed emoji use. Logistics and CTA.
        3. Twitter/X: 150+ words (treat as a thread-style single post). High energy.
        4. Hashtags: 15-20 trending tags.
        
        Return ONLY a JSON object with this exact structure:
        {{
          "LinkedIn": "...",
          "Twitter/X": "...",
          "Instagram": "...",
          "hashtags": ["...", "..."]
        }}
        
        Do not include any text before or after the JSON.
        """
        
        try:
            response = ollama.chat(
                model='llama3.2', 
                messages=[{'role': 'user', 'content': prompt}],
                options={'temperature': 0.8, 'num_predict': 4096}
            )
            content_raw = response['message']['content']
            print(f"Ollama Raw Output: {content_raw[:200]}...") # Log for debugging
            
            import json
            import re
            try:
                # More aggressive JSON cleaning - find first '{' and last '}'
                start = content_raw.find('{')
                end = content_raw.rfind('}') + 1
                if start != -1 and end != -1:
                    json_str = content_raw[start:end]
                    generated_content = json.loads(json_str)
                else:
                    raise ValueError("No JSON found in response")
            except Exception as e:
                print(f"FAILED TO PARSE AI JSON: {e}")
                generated_content = {}
        except Exception as ollama_error:
            print(f"Ollama chat failed (e.g., model missing): {ollama_error}")
            generated_content = {}

        # High-Quality Premium Long-Form Fallback
        # This ensures the user gets a "long form" result even if the local model fails
        if not generated_content.get("LinkedIn") or len(generated_content.get("LinkedIn", "")) < 300:
            await log_activity("Using Premium Long-Form Fallback")
            
            long_linkedin = f"""🚀 THE FUTURE IS HERE: Join us for the {data.eventName}!

Are you ready to witness the evolution of intelligence? The world is changing faster than ever, and at the heart of this transformation is the convergence of {data.theme}. 

From March 15-17, 2026, the brightest minds in AI and Technology will converge in {data.location} for three days of groundbreaking innovation, strategic networking, and deep-dive technical sessions. 

Whether you're a developer pushing the boundaries of code, a tech enthusiast curious about what the future holds, or a business leader looking to scale your enterprise with AI, this is the room you need to be in.

📍 Location: {data.location}
📅 Date: {data.date}
💡 Theme: {data.theme}

Expect high-octane keynotes, hands-on tech labs, and networking opportunities that will redefine your professional trajectory. From Generative AI to the next frontier of robotics, we're diving deep into the tech that's shaping our tomorrow.

Don't miss your chance to stay ahead of the curve. Secure your spot today and be part of the conversation shaping tomorrow.

🔥 Early Bird Registrations are NOW OPEN!
🔗 Register now at the link in our bio/comments!

#TechSummit2026 #AIRevolution #FutureTech #Innovation #MachineLearning #{data.eventName.replace(' ', '')} #DigitalTransformation #BhubaneswarTech #TechInnovation #SoftwareDevelopment #TechCommunity"""

            long_instagram = f"""The future isn't coming—it's already here. ✨🚀

Are you ready to witness the evolution of intelligence? Join us at {data.eventName}, where the brightest minds in AI and Technology converge for three days of groundbreaking innovation! 🤖💡

📍 Location: {data.location}
📅 Date: {data.date}
✨ Theme: {data.theme}

Expect high-octane keynotes, hands-on tech labs, and networking opportunities that will redefine your professional trajectory. We're diving deep into everything from Generative AI to robotics. 🚀👋

Whether you’re a developer, a tech enthusiast, or a visionary leader, this is the place to be.

🔥 Early Bird Registrations are NOW OPEN!
🔗 Secure your spot today via the link in our bio!

Let's build the future together. 🤝✨

#TechSummit2026 #AIRevolution #FutureOfTech #AITrends #InnovationHub #TechEvents2026 #AIInnovation"""

            long_twitter = f"""The future is arriving in {data.location}! �✨

Join us for #{data.eventName.replace(' ', '')} as we dive deep into the world of AI and cutting-edge technology. Experience 3 days of innovation that will redefine the digital era. 🤖🌐

📍 {data.location}
📅 {data.date}

Secure your spot today! ⬇️
#TechSummit2026 #AI #FutureOfTech #Innovation"""

            generated_content = {
                "LinkedIn": long_linkedin,
                "Twitter/X": long_twitter,
                "Instagram": long_instagram,
                "hashtags": ["Tech", "Future", "AI"]
            }

        # 2. Image Generation
        HF_KEY = os.getenv("HUGGINGFACE_API_KEY")
        image_prompt = f"Professional posters for {data.eventName}, tech aesthetic, 8k"
        image_url = None

        if HF_KEY:
            try:
                API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0"
                payload = {"inputs": image_prompt, "options": {"wait_for_model": True}}
                hf_res = requests.post(API_URL, headers={"Authorization": f"Bearer {HF_KEY}"}, json=payload, timeout=60)
                if hf_res.status_code == 200:
                    import base64
                    image_url = f"data:image/jpeg;base64,{base64.b64encode(hf_res.content).decode('utf-8')}"
                    await log_activity("Generated HF image")
            except: pass

        if not image_url:
            image_url = f"https://pollinations.ai/p/{image_prompt.replace(' ', '%20')}?width=1024&height=1024&seed={datetime.now().microsecond}"
            await log_activity("Using Pollinations fallback image")

        # 3. Save and Return
        for platform in platforms:
            post = {
                "platform": platform,
                "caption": generated_content.get(platform, ""),
                "image_url": image_url,
                "hashtags": generated_content.get("hashtags", []),
                "suggested_time": "Tomorrow at 10:00 AM"
            }
            results.append(post)
            try:
                supabase.table("generated_posts").insert(post).execute()
            except: pass

        await log_activity(f"Completed generation for {data.eventName}")
        print(f"DEBUG: Generated image_url starts with: {str(image_url)[:100]}...")
        return {"results": results, "image_url": image_url}

    except Exception as e:
        await log_activity(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/schedule-post")
async def schedule_post(data: PostData):
    await log_activity(f"Scheduling post for {data.platform}", data.platform)
    post_id = "local-" + str(datetime.now().timestamp())
    
    try:
        res = supabase.table("generated_posts").insert(data.dict()).execute()
        if res.data: post_id = res.data[0]['id']
    except: pass
    
    scheduled_dt = datetime.fromisoformat(data.scheduled_time.replace("Z", "+00:00"))
    scheduler.add_job(publish_to_social_media, 'date', run_date=scheduled_dt, args=[post_id, data.platform, data.caption])
    
    return {"status": "success", "post_id": post_id}

@app.post("/api/post-now")
async def post_now(data: PostNowData):
    await log_activity(f"Publishing post directly to {data.platform}", data.platform)
    post_id = "local-" + str(datetime.now().timestamp())
    
    try:
        post_dict = data.dict()
        post_dict['scheduled_time'] = datetime.now().isoformat()
        res = supabase.table("generated_posts").insert(post_dict).execute()
        if res.data: post_id = res.data[0]['id']
    except: pass
    
    print(f"Publishing to {data.platform}: {data.caption}")
    try:
        supabase.table("generated_posts").update({"status": "published"}).eq("id", post_id).execute()
    except Exception:
        pass
    
    await log_activity(f"Published post to {data.platform}", data.platform)
    
    return {"status": "success", "post_id": post_id}

def personalize_template(template: str, participant: dict, event_name: str) -> str:
    # Safely handle missing keys by using get()
    return template.format(
        name=participant.get("name", "Participant"),
        email=participant.get("email", ""),
        team_name=participant.get("team_name", "N/A"),
        college=participant.get("college", "N/A"),
        event_name=event_name
    )

@app.post("/api/upload-participants")
async def upload_participants(file: UploadFile = File(...)):
    global participants_storage
    await log_activity(f"CSV Uploaded: {file.filename}")
    
    try:
        content = await file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_excel(io.BytesIO(content))
        
        # Normalize column names to lowercase and underscores
        df.columns = [c.lower().strip().replace(" ", "_") for c in df.columns]
        
        participants = df.to_dict('records')
        participants_storage = participants # Store in memory
        swarm_controller("participants_uploaded", participants)
        return participants
    except Exception as e:
        await log_activity(f"File Upload Error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

@app.post("/api/preview-emails")
async def preview_emails(template: EmailTemplate):
    await log_activity("Emails Previewed")
    previews = []
    
    # Use participants from request or falling back to memory
    active_participants = template.participants or participants_storage
    
    # Preview for first 5 participants
    for p in active_participants[:5]:
        try:
            preview = {
                "name": p.get("name", "Participant"),
                "email": p.get("email", ""),
                "subject": personalize_template(template.subjectTemplate, p, template.eventName),
                "body": personalize_template(template.bodyTemplate, p, template.eventName)
            }
            previews.append(preview)
        except Exception:
            continue
    
    return previews

@app.post("/api/send-bulk-emails")
async def send_bulk_emails(template: EmailTemplate):
    await log_activity("Started bulk email sending")
    
    EMAIL_USER = os.getenv("EMAIL_USER")
    EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
    
    active_participants = template.participants or participants_storage

    if not EMAIL_USER or not EMAIL_PASSWORD:
        await log_activity("Email bulk sending failed: Credentials missing")
        raise HTTPException(status_code=500, detail="EMAIL_USER or EMAIL_PASSWORD not configured")

    if not active_participants:
         raise HTTPException(status_code=400, detail="No participants uploaded")

    sent_count = 0
    failed_count = 0
    
    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        
        for p in active_participants:
            try:
                msg = MIMEMultipart()
                msg['From'] = EMAIL_USER
                msg['To'] = p.get('email', '')
                msg['Subject'] = personalize_template(template.subjectTemplate, p, template.eventName)
                
                body = personalize_template(template.bodyTemplate, p, template.eventName)
                msg.attach(MIMEText(body, 'plain'))
                
                server.send_message(msg)
                
                log_entry = {"email": p.get('email'), "status": "sent", "timestamp": datetime.now().isoformat()}
                local_email_logs.insert(0, log_entry)
                try: supabase.table("email_logs").insert(log_entry).execute()
                except: pass
                
                sent_count += 1
            except Exception as e:
                failed_count += 1
                log_entry = {"email": p.get('email'), "status": "failed", "timestamp": datetime.now().isoformat(), "error_message": str(e)}
                local_email_logs.insert(0, log_entry)
                try: supabase.table("email_logs").insert(log_entry).execute()
                except: pass
        
        server.quit()
        await log_activity(f"Bulk email completed. Sent: {sent_count}, Failed: {failed_count}")
        return {"sent": sent_count, "failed": failed_count}
        
    except Exception as e:
        await log_activity(f"SMTP Critical Failure: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/email-logs")
async def get_email_logs():
    try:
        res = supabase.table("email_logs").select("*").order("timestamp", desc=True).limit(50).execute()
        if res.data: return res.data
    except: pass
    return local_email_logs if local_email_logs else [{"email": "system", "status": "idle", "timestamp": datetime.now().isoformat()}]

@app.get("/api/agent-logs")
async def get_logs():
    try:
        res = supabase.table("agent_logs").select("*").order("timestamp", desc=True).limit(50).execute()
        if res.data: return res.data
    except: pass
    return local_logs if local_logs else [{"action": "Local Mode Active", "timestamp": datetime.now().isoformat()}]

from datetime import timedelta

# Event Scheduler Agent Models
class Speaker(BaseModel):
    id: str
    name: str
    topic: str
    availability_start: str
    availability_end: str

class Room(BaseModel):
    id: str
    name: str
    capacity: int

class Session(BaseModel):
    id: str
    title: str
    speaker_id: str
    duration: int
    preferred_time: str
    scheduled_start: Optional[str] = None
    scheduled_end: Optional[str] = None
    room_id: Optional[str] = None

class Conflict(BaseModel):
    type: str 
    message: str
    session_ids: List[str]

class ScheduleRequest(BaseModel):
    sessions: List[dict]
    rooms: List[dict]
    event_date: str
    event_start_hour: str
    event_end_hour: str

# In-memory DB for Scheduler
speakers_db: List[dict] = []
rooms_db: List[dict] = []
sessions_db: List[dict] = []
scheduler_logs: List[str] = []

class EventSchedulerAgent:
    def __init__(self):
        self.sessions = []
        self.speakers = {}
        self.rooms = []
        self.conflicts = []
        self.schedule = []
        self.explanation = ""

    def log(self, message: str):
        timestamp = datetime.now().strftime("%I:%M:%S %p").lstrip("0")
        formatted_message = f"[{timestamp}] [Scheduler Agent] {message}"
        print(formatted_message)
        scheduler_logs.append(formatted_message)
        
        # Determine event type
        event_type = "activity"
        if "conflict" in message.lower(): event_type = "schedule_conflict"
        if "Scheduled" in message: event_type = "session_scheduled"
        
        log_swarm_event_sync("Scheduler Agent", event_type, message)

    def load_data(self):
        self.sessions = [s.copy() for s in sessions_db]
        
        # Parse times
        for s in self.sessions:
            try:
                s["_preferred_dt"] = datetime.strptime(s.get("preferred_time", "09:00"), "%H:%M")
            except ValueError:
                s["_preferred_dt"] = datetime.strptime("09:00", "%H:%M")

        self.speakers = {s["id"]: s for s in speakers_db}
        self.rooms = [r.copy() for r in rooms_db]
        self.conflicts = []
        self.schedule = []
        self.explanation = ""

    def detect_conflicts(self):
        pass

    def run(self):
        scheduler_logs.clear() # clear previous run logs
        self.log("Scheduler started")
        
        self.load_data()
        self.log(f"Loaded {len(self.sessions)} sessions")
        self.log(f"Loaded {len(self.speakers)} speakers")
        self.log(f"Loaded {len(self.rooms)} rooms")
        
        # Sort sessions by preferred time
        self.sessions.sort(key=lambda x: x["_preferred_dt"])
        
        self.generate_schedule()
        
        self.log("Final schedule generated")
        self.log(f"Schedule applied — {len(self.schedule)} sessions scheduled")
        
        if self.conflicts:
            unique_conflict_sessions = len(set(c["session"] for c in self.conflicts))
            self.explanation = (f"AI Explanation:\n"
                                f"Detected speaker and room conflicts across {unique_conflict_sessions} sessions.\n"
                                f"Sessions were moved to the next available time slots to avoid overlap and respect room constraints.")
            # Write to swarm memory FIRST, then trigger controller
            self.log("[Swarm Memory] Schedule update stored.")
            update_memory("last_schedule_update", self.schedule)
            ai_insight = swarm_controller("schedule_updated", self.schedule)
            if ai_insight:
                self.log("[Reasoning Agent] Generating AI explanation")
                for line in ai_insight.splitlines():
                    if line.strip():
                        self.log(line)
        else:
            self.explanation = "AI Explanation: All sessions were scheduled perfectly at their preferred times. No conflicts detected."
            
        self.log(self.explanation)
            
        return {
            "schedule": self.schedule,
            "conflicts": self.conflicts,
            "logs": scheduler_logs,
            "summary": self.explanation
        }

    def run_with_payload(self, req: ScheduleRequest):
        scheduler_logs.clear()
        self.log("Scheduler started")
        
        self.sessions = [s.copy() for s in req.sessions]
        self.rooms = [r.copy() for r in req.rooms]
        
        # Load speakers from Supabase to match UI datasource
        self.speakers = {}
        try:
            sp_res = supabase.table("speakers").select("*").execute()
            if sp_res.data:
                self.speakers = {sp["id"]: sp for sp in sp_res.data}
        except Exception:
            pass
            
        self.conflicts = []
        self.schedule = []
        self.explanation = ""
        self.event_date = req.event_date
        
        self.log(f"Loaded {len(self.sessions)} sessions")
        self.log(f"Loaded {len(self.speakers)} speakers")
        self.log(f"Loaded {len(self.rooms)} rooms")
        
        for s in self.sessions:
            try:
                if s.get("preferred_time"):
                    s["_preferred_dt"] = datetime.strptime(f"{req.event_date} {s['preferred_time']}", "%Y-%m-%d %H:%M")
                else:
                    s["_preferred_dt"] = datetime.strptime(f"{req.event_date} {req.event_start_hour}", "%Y-%m-%d %H:%M")
            except Exception:
                s["_preferred_dt"] = datetime.strptime(f"{req.event_date} {req.event_start_hour}", "%Y-%m-%d %H:%M")
        
        self.sessions.sort(key=lambda x: x["_preferred_dt"]) # sort by preferred time
        
        self.generate_schedule()
        
        self.log("Final schedule generated")
        self.log(f"Schedule applied — {len(self.schedule)} sessions scheduled")
        
        if self.conflicts:
            unique_conflict_sessions = len(set(c["session"] for c in self.conflicts))
            self.explanation = (f"AI Explanation:\n"
                                f"Detected speaker and room conflicts across {unique_conflict_sessions} sessions.\n"
                                f"Sessions were moved to the next available time slots to avoid overlap and respect room constraints.")
            
            # Write to swarm memory FIRST, then trigger controller
            self.log("[Swarm Memory] Schedule update stored.")
            update_memory("last_schedule_update", self.schedule)
            ai_insight = swarm_controller("schedule_updated", self.schedule)
            if ai_insight:
                self.log("[Reasoning Agent] Generating AI explanation")
                for line in ai_insight.splitlines():
                    if line.strip():
                        self.log(line)
        else:
            self.explanation = "AI Explanation: All sessions were scheduled perfectly at their preferred times. No conflicts detected."
            
        self.log(self.explanation)
        
        return {
            "schedule": self.schedule,
            "conflicts": self.conflicts,
            "logs": scheduler_logs,
            "summary": self.explanation
        }

    def generate_schedule(self):
        current_time = datetime.strptime("09:00", "%H:%M")
        
        room_availability = {r["id"]: current_time for r in self.rooms}
        speaker_schedule = {s: [] for s in self.speakers.keys()}
        
        self.log("Validating speaker availability")
        for sp_id, sp in self.speakers.items():
            avail_start = sp.get("availability_start", "N/A")
            avail_end = sp.get("availability_end", "N/A")
            sp_name = sp.get("name", "Unknown")
            self.log(f"Speaker {sp_name} available from {avail_start} to {avail_end}")
            
        self.log("Checking room capacity")
        self.log("Checking preferred session times")
        
        for session in self.sessions:
            speaker_id = session.get("speaker_id")
            title = session.get("title", "Unknown Session")
            duration = session.get("duration", 60)
            
            self.log(f"Attempting to schedule session: {title}")
            pref_time_str = session.get("preferred_time", "09:00")
            self.log(f"Preferred time requested: {pref_time_str}")
            
            if not self.rooms:
                 self.log(f"No rooms available to schedule {title}")
                 continue
                 
            # Target start time
            start_time = getattr(self, 'event_date', None)
            if start_time:
                assigned_start = session.get("_assigned_start_dt", session.get("_preferred_dt", datetime.strptime(f"{self.event_date} 09:00", "%Y-%m-%d %H:%M")))
            else:
                assigned_start = session.get("_assigned_start_dt", session.get("_preferred_dt", current_time))
            
            assigned_room = None
            assigned_room_obj = None
            resolved = False
            initial_assigned_start = assigned_start
            
            # Initialize conflict tracking for this run
            session["has_conflict"] = False
            session["conflict_type"] = None
            
            while not resolved:
                # Find space based on preferences or availability
                pref_room_id = session.get("room_id")
                pref_room_name = session.get("room_name")
                if not pref_room_name and pref_room_id:
                     pref_room_name = next((r["name"] for r in self.rooms if r["id"] == pref_room_id), "Unknown Room")
                
                if pref_room_id:
                    if room_availability.get(pref_room_id, current_time) <= assigned_start:
                        assigned_room = pref_room_id
                        assigned_room_obj = next((r for r in self.rooms if r["id"] == pref_room_id), None)
                    else:
                        self.log(f"Room conflict detected for {pref_room_name}")
                        new_time = assigned_start + timedelta(minutes=duration)
                        self.log(f"Moving session \"{title}\" from {assigned_start.strftime('%H:%M')} to {new_time.strftime('%H:%M')}")
                        assigned_start = new_time
                        self.conflicts.append({"session": title, "reason": "room conflict"})
                        session["has_conflict"] = True
                        session["conflict_type"] = "room"
                        continue
                else:
                    for room in self.rooms:
                        r_id = room["id"]
                        if room_availability[r_id] <= assigned_start:
                            assigned_room = r_id
                            assigned_room_obj = room
                            break
                    
                    if not assigned_room:
                        self.log(f"Room conflict detected (all rooms occupied)")
                        new_time = assigned_start + timedelta(minutes=duration)
                        self.log(f"Moving session \"{title}\" from {assigned_start.strftime('%H:%M')} to {new_time.strftime('%H:%M')}")
                        assigned_start = new_time
                        self.conflicts.append({"session": title, "reason": "room conflict"})
                        session["has_conflict"] = True
                        session["conflict_type"] = "room"
                        continue
                        
                end_time = assigned_start + timedelta(minutes=duration)
                
                # Check expected speaker availability
                speaker_avail_start_str = session.get("speaker_availability_start")
                speaker_avail_end_str = session.get("speaker_availability_end")
                av_conflict = False
                
                start_date_str = start_time if start_time else datetime.now().strftime("%Y-%m-%d")
                
                if speaker_avail_start_str and speaker_avail_end_str:
                    try:
                        avail_start = datetime.strptime(f"{start_date_str} {speaker_avail_start_str}", "%Y-%m-%d %H:%M")
                        avail_end = datetime.strptime(f"{start_date_str} {speaker_avail_end_str}", "%Y-%m-%d %H:%M")
                        
                        if assigned_start < avail_start or end_time > avail_end:
                            av_conflict = True
                            sp_name = session.get("speaker_name")
                            if not sp_name and speaker_id in self.speakers:
                                sp_name = self.speakers[speaker_id].get("name")
                            if not sp_name: sp_name = "Speaker"
                            
                            if assigned_start < avail_start:
                                self.log(f"Speaker conflict detected for {sp_name}")
                                self.log(f"Moving session \"{title}\" from {assigned_start.strftime('%H:%M')} to {avail_start.strftime('%H:%M')}")
                                assigned_start = avail_start
                                assigned_room = None
                                session["has_conflict"] = True
                                session["conflict_type"] = "availability"
                                self.conflicts.append({"session": title, "reason": "speaker unavailable at preferred time"})
                                continue
                            else:
                                self.log(f"Speaker conflict detected for {sp_name} (exceeds end time)")
                                session["has_conflict"] = True
                                session["conflict_type"] = "availability"
                                self.conflicts.append({"session": title, "reason": "speaker unavailable (exceeds end time)"})
                    except Exception: pass

                # Check double booking
                has_speaker_conflict = False
                if speaker_id:
                    for prev_start, prev_end in speaker_schedule.get(speaker_id, []):
                        if max(assigned_start, prev_start) < min(end_time, prev_end):
                            has_speaker_conflict = True
                            break
                        
                if has_speaker_conflict:
                    sp_name = session.get("speaker_name")
                    if not sp_name and speaker_id in self.speakers:
                         sp_name = self.speakers[speaker_id].get("name")
                    if not sp_name:
                         sp_name = "Speaker"
                    self.log(f"Speaker conflict detected for {sp_name}")
                    new_time = assigned_start + timedelta(minutes=duration)
                    self.log(f"Moving session \"{title}\" from {assigned_start.strftime('%H:%M')} to {new_time.strftime('%H:%M')}")
                    assigned_start = new_time
                    assigned_room = None
                    session["has_conflict"] = True
                    session["conflict_type"] = "speaker"
                    self.conflicts.append({"session": title, "reason": "speaker double booked"})
                else:
                    resolved = True

            # Assign
            room_availability[assigned_room] = end_time
            if speaker_id:
                if speaker_id not in speaker_schedule:
                    speaker_schedule[speaker_id] = []
                speaker_schedule[speaker_id].append((assigned_start, end_time))
            
            room_name = assigned_room_obj["name"] if assigned_room_obj else assigned_room
            self.log(f"Assigning room {room_name}")
            self.log(f"Assigning session '{title}' to {room_name}")
            
            self.schedule.append({
                "session_id": session.get("id"),
                "session": title,
                "room_id": assigned_room,
                "start_time": assigned_start.isoformat(),
                "end_time": end_time.isoformat(),
                "scheduled_start": assigned_start.strftime("%H:%M"),
                "scheduled_end": end_time.strftime("%H:%M"),
                "has_conflict": session.get("has_conflict", False),
                "conflict_type": session.get("conflict_type")
            })
            self.log(f"[Scheduler Agent] Scheduled '{title}' with conflict_type: {session.get('conflict_type')}")

    def resolve_conflicts(self):
        # Already resolved during assignment loop
        pass

# Event Scheduler Endpoints
@app.post("/api/speakers")
async def add_speaker(speaker: Speaker):
    speakers_db.append(speaker.dict())
    return {"status": "success", "speaker": speaker}

@app.post("/api/rooms")
async def add_room(room: Room):
    rooms_db.append(room.dict())
    return {"status": "success", "room": room}

@app.post("/api/sessions")
async def add_session(session: Session):
    sessions_db.append(session.dict())
    return {"status": "success", "session": session}

@app.get("/api/speakers")
async def get_speakers():
    return speakers_db

@app.get("/api/rooms")
async def get_rooms():
    return rooms_db

@app.get("/api/sessions")
async def get_sessions():
    return sessions_db

@app.post("/api/auto-schedule")
async def auto_schedule(req: ScheduleRequest = None):
    agent = EventSchedulerAgent()
    if req:
        return agent.run_with_payload(req)
    else:
        return agent.run()

@app.get("/api/schedule")
async def get_schedule():
    # Run a dummy or return static if needed
    # Usually UI gets schedule from auto-schedule run, but we can expose it here
    return {"schedule": []}

@app.get("/api/conflicts")
async def get_conflicts():
    return {"conflicts": []}

@app.get("/api/logs") # note: overrides /api/agent-logs maybe?
async def get_scheduler_logs():
    return scheduler_logs

@app.delete("/api/logs")
async def clear_scheduler_logs():
    scheduler_logs.clear()
    return {"message": "Logs cleared successfully"}

@app.get("/api/swarm-memory")
async def get_swarm_memory():
    """Inspect the current shared memory state across all agents."""
    from swarm_memory import get_full_memory
    return get_full_memory()

@app.get("/api/swarm/activity")
async def get_swarm_activity():
    from swarm_memory import swarm_memory
    return swarm_memory.get("activity_feed", [])

@app.get("/api/swarm/insight")
async def get_swarm_insight():
    from swarm_memory import swarm_memory
    return {"ai_insight": swarm_memory.get("ai_insight", "")}

@app.get("/api/swarm/status")
async def get_swarm_status():
    from swarm_memory import swarm_memory
    agents = swarm_memory.get("agent_status", {})
    return {
        "agents_online": len(agents),
        "active_now": len([a for a in agents.values() if a["status"] != "idle"]),
        "total_tasks": sum(a["tasks"] for a in agents.values()),
        "connections": 10
    }

@app.get("/api/swarm/graph")
async def get_swarm_graph():
    return {
        "connections": [
            {"from": "Scheduler Agent", "to": "Orchestrator"},
            {"from": "Orchestrator", "to": "Email Agent"},
            {"from": "Orchestrator", "to": "Social Media Agent"},
            {"from": "Orchestrator", "to": "Reasoning Agent"},
            {"from": "Orchestrator", "to": "Analytics Agent"},
            {"from": "Orchestrator", "to": "Crisis Agent"},
            {"from": "Email Agent", "to": "Analytics Agent"},
            {"from": "Scheduler Agent", "to": "Crisis Agent"},
            {"from": "Crisis Agent", "to": "Email Agent"}
        ]
    }

@app.get("/api/swarm/agents")
async def get_swarm_agents():
    from swarm_memory import swarm_memory
    status = swarm_memory.get("agent_status", {})
    return [{"name": name, **data} for name, data in status.items()]

@app.post("/api/swarm/simulate")
async def simulate_swarm(payload: dict = Body(...)):
    workflow = payload.get("workflow")
    from swarm_controller import swarm_controller
    
    if workflow == "email_campaign":
        swarm_controller("participants_uploaded", [{"name": "Test User", "email": "test@example.com"}])
    elif workflow == "crisis_response":
        swarm_controller("crisis_detected", {"reason": "Speaker Emergency"})
    elif workflow == "social_campaign":
        swarm_controller("event_created", {"eventName": "Swarm Launch", "theme": "AI Automation"})
    elif workflow == "schedule_optimization":
        swarm_controller("schedule_updated", [{"session": "AI Keynote", "scheduled_start": "10:00 AM"}])
    else:
        raise HTTPException(status_code=400, detail="Invalid workflow")
    
    return {"status": "triggered", "workflow": workflow}

@app.get("/api/swarm/memory")
async def get_swarm_memory_values():
    from swarm_memory import swarm_memory
    
    participants_count = len(swarm_memory.get("participants", []))
    
    # Fallback to Supabase if memory is empty (system restart/cleared)
    if participants_count == 0:
        try:
            res = supabase.table("participants").select("id", count="exact").execute()
            if res.count is not None:
                participants_count = res.count
        except Exception:
            pass

    return {
        "last_schedule_update": len(swarm_memory.get("last_schedule_update", []) or []),
        "generated_posts": len(swarm_memory.get("generated_posts", [])),
        "email_notifications": len(swarm_memory.get("email_notifications", [])),
        "participants": participants_count
    }

@app.get("/api/email/activity")
async def get_email_activity():
    from swarm_memory import swarm_memory
    return swarm_memory.get("email_logs", [])

@app.get("/api/email/drafts")
async def get_email_drafts():
    from swarm_memory import swarm_memory
    memory_drafts = swarm_memory.get("email_notifications", [])
    
    # Try fetching from DB for persistence
    db_drafts = []
    try:
        res = supabase.table("email_campaigns").select("*").eq("status", "draft").order("created_at", desc=True).execute()
        if res.data:
            for d in res.data:
                db_drafts.append({
                    "subject": d["subject_template"],
                    "body": d["body_template"],
                    "sent_to": d["total_recipients"],
                    "timestamp": d["created_at"]
                })
    except Exception:
        pass
        
    return memory_drafts + db_drafts


@app.delete("/api/email/drafts")
async def clear_email_drafts():
    from swarm_memory import update_memory
    update_memory("email_notifications", [])
    return {"status": "cleared"}


@app.get("/api/social/logs")
async def get_social_logs():
    from swarm_memory import swarm_memory
    return swarm_memory.get("social_logs", [])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
