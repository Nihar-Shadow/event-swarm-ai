
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

try:
    print("Checking agent_logs table...")
    res = supabase.table("agent_logs").select("*").limit(1).execute()
    print("agent_logs table exists.")
except Exception as e:
    print(f"agent_logs check failed: {e}")

try:
    print("\nChecking generated_posts table...")
    res = supabase.table("generated_posts").select("*").limit(1).execute()
    print("generated_posts table exists.")
except Exception as e:
    print(f"generated_posts check failed: {e}")
