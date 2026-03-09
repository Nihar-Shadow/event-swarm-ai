
import os
import asyncio
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from apscheduler.schedulers.background import BackgroundScheduler
from dotenv import load_dotenv
import requests
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
