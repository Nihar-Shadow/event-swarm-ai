from datetime import datetime
from swarm_memory import (
    update_memory, get_memory, append_memory, log_memory,
    log_activity_feed, log_email_agent_activity, log_social_agent_activity,
    update_agent_status
)
from reasoning_agent import run_reasoning_agent


# ─────────────────────────────────────────────────
#  Swarm Controller — Central Agent Orchestrator
# ─────────────────────────────────────────────────

def _ts() -> str:
    return datetime.now().strftime("%I:%M:%S %p").lstrip("0")


def log_controller(message: str) -> None:
    print(f"[{_ts()}] [Swarm Controller] {message}")


# ──────────────────────────────────────
#  Email Agent
# ──────────────────────────────────────

def run_email_agent(data=None) -> None:
    log_controller("Triggering Email Agent")

    schedule_update = get_memory("last_schedule_update")
    participants    = get_memory("participants") or []
    ai_insight      = get_memory("ai_insight") or ""

    from main import log_swarm_event_sync
    log_swarm_event_sync("Email Agent", "processing", "Preparing notifications")

    print(f"[{_ts()}] [Email Agent] Reading schedule update from swarm memory")

    if schedule_update:
        print(f"[{_ts()}] [Email Agent] Found {len(schedule_update)} scheduled session(s)")
        notifications = []

        for slot in schedule_update:
            session_name = slot.get("session", "Unknown Session")
            new_time     = slot.get("scheduled_start", "TBD")
            conflict_type = slot.get("conflict_type")

            body_lines = [f"Session '{session_name}' has been scheduled at {new_time}."]
            if conflict_type:
                body_lines.append(
                    f"Note: This session was moved due to a {conflict_type} conflict."
                )
            if ai_insight:
                body_lines.append(f"\n{ai_insight}")

            msg = {
                "subject": "Schedule Update",
                "body": "\n".join(body_lines),
                "sent_to": len(participants),
                "timestamp": datetime.now().isoformat()
            }
            notifications.append(msg)
            print(f"[{_ts()}] [Email Agent] Draft: '{session_name}' at {new_time} → {len(participants)} recipient(s)")

        update_agent_status("Email Agent", "active")
        update_memory("email_notifications", notifications)
        print(f"[{_ts()}] [Email Agent] {len(notifications)} notification(s) prepared and stored in swarm memory.")

        from main import supabase
        for msg in notifications:
            try:
                supabase.table("email_campaigns").insert({
                    "event_name": "Schedule Update Draft",
                    "subject_template": msg["subject"],
                    "body_template": msg["body"],
                    "status": "draft",
                    "total_recipients": msg["sent_to"]
                }).execute()
            except Exception as e:
                print(f"Failed to persist draft to DB: {e}")

        log_email_agent_activity(f"Prepared {len(notifications)} schedule update notifications")
        log_email_agent_activity(f"Recipients detected: {len(participants)}")
        log_email_agent_activity("Emails ready for sending")
        
        from main import log_swarm_event_sync
        log_swarm_event_sync(
            "Email Agent", 
            "notifications_prepared", 
            f"Prepared {len(notifications)} notification emails",
            memory_update={"email_notifications": len(notifications)}
        )
        
        update_agent_status("Email Agent", "idle", 1)
    else:
        basic = {
            "subject": "Event Update",
            "body": ai_insight or str(data)[:200] if data else "No data",
            "timestamp": datetime.now().isoformat()
        }
        append_memory("email_notifications", basic)
        print(f"[{_ts()}] [Email Agent] No schedule in memory — stored basic notification.")


# ──────────────────────────────────────
#  Social Media Agent
# ──────────────────────────────────────

def run_social_agent(data=None) -> None:
    log_controller("Triggering Social Media Agent")

    schedule_update = get_memory("last_schedule_update")
    event           = get_memory("event_created")
    ai_insight      = get_memory("ai_insight") or ""

    from main import log_swarm_event_sync
    log_swarm_event_sync("Social Media Agent", "processing", "Generating announcement post")

    print(f"[{_ts()}] [Social Media Agent] Reading schedule update from swarm memory")

    posts = []

    if schedule_update:
        print(f"[{_ts()}] [Social Media Agent] Generating schedule update post from AI insight")

        # One consolidated post using the Reasoning Agent's summary
        if ai_insight:
            caption = f"🚨 Schedule Update\n\n{ai_insight}\n\n#EventUpdate #EventSwarmAI"
        else:
            lines = []
            for slot in schedule_update:
                sn = slot.get("session", "Session")
                st = slot.get("scheduled_start", "TBD")
                ct = slot.get("conflict_type")
                line = f'• "{sn}" → {st}'
                if ct:
                    line += f" (moved due to {ct} conflict)"
                lines.append(line)
            caption = "🚨 Schedule Update\n\n" + "\n".join(lines) + "\n\n#EventUpdate #EventSwarmAI"

        posts.append({"platform": "all", "caption": caption, "timestamp": datetime.now().isoformat()})
        print(f"[{_ts()}] [Social Media Agent] Consolidated schedule-update post generated")
        log_social_agent_activity("[Social Agent] Reading AI insight")
        log_social_agent_activity("[Social Agent] Generating schedule update post")
        log_social_agent_activity("[Social Agent] Post stored in swarm memory")
        
        from main import log_swarm_event_sync
        log_swarm_event_sync(
            "Social Media Agent", 
            "post_generated", 
            "Generated schedule update announcement",
            memory_update={"generated_posts": len(posts)}
        )

    elif event:
        caption = (
            f"🚀 Announcing {event.get('eventName', 'our event')}!\n"
            f"Theme: {event.get('theme', '')}\n"
            f"Date: {event.get('date', '')} | Location: {event.get('location', '')}\n"
            f"#EventSwarm #AI #Innovation"
        )
        posts.append({"platform": "all", "caption": caption, "timestamp": datetime.now().isoformat()})
        print(f"[{_ts()}] [Social Media Agent] Generated event announcement post")
        log_social_agent_activity("[Social Agent] Reading event details")
        log_social_agent_activity("[Social Agent] Generating event announcement post")
        log_social_agent_activity("[Social Agent] Post stored in swarm memory")
        log_activity_feed("Social Media Agent", "Generated event announcement post")
    else:
        print(f"[{_ts()}] [Social Media Agent] No schedule or event found in swarm memory — no posts generated.")

    if posts:
        update_agent_status("Social Media Agent", "active")
        update_memory("generated_posts", posts)
        print(f"[{_ts()}] [Social Media Agent] {len(posts)} post(s) stored in swarm memory.")
        update_agent_status("Social Media Agent", "idle", 1)


# ──────────────────────────────────────
#  Swarm Controller — Event Dispatcher
# ──────────────────────────────────────

def swarm_controller(event: str, data=None) -> str:
    """
    Central controller to orchestrate multiple agents via shared memory.
    Flow:
      1. Controller receives event
      2. State is written to swarm memory
      3. Reasoning Agent analyses decisions → writes ai_insight
      4. Email Agent reads memory → sends enriched notifications
      5. Social Agent reads memory → generates insight-driven posts
    Returns the ai_insight string so callers can append it to UI logs.
    """
    log_controller(f"Event detected: '{event}'")
    ai_insight = ""

    if event == "schedule_updated":
        update_agent_status("Orchestrator", "active")
        update_agent_status("Scheduler Agent", "active")
        
        from main import log_swarm_event_sync
        log_swarm_event_sync("Scheduler Agent", "active", "Resolving room conflict")
        
        # Write to memory
        update_memory("last_schedule_update", data)
        log_swarm_event_sync("Swarm Memory", "memory_update", "Updated with schedule changes", 
                           memory_update={"last_schedule_update": len(data) if data else 0})

        log_controller("Triggering Reasoning Agent")
        update_agent_status("Reasoning Agent", "active")
        log_swarm_event_sync("Reasoning Agent", "active", "Analyzing scheduling decision")
        ai_insight = run_reasoning_agent()
        update_agent_status("Reasoning Agent", "idle", 1)

        log_controller("Triggering downstream agents (Email → Social Media)")
        run_email_agent(data)
        run_social_agent(data)
        log_memory()
        update_agent_status("Scheduler Agent", "idle", 1)
        update_agent_status("Orchestrator", "idle", 1)

    elif event == "participants_uploaded":
        update_agent_status("Orchestrator", "active")
        log_controller("Participants uploaded — writing to swarm memory")
        update_memory("participants", data)
        
        from main import log_swarm_event_sync
        log_swarm_event_sync(
            "Orchestrator", 
            "participants_synced", 
            f"Synced {len(data) if data else 0} participants to swarm memory",
            memory_update={"participants": len(data) if data else 0}
        )
        
        run_email_agent(data)
        log_memory()
        update_agent_status("Orchestrator", "idle", 1)

    elif event == "event_created":
        update_agent_status("Orchestrator", "active")
        log_controller("Event created — writing to swarm memory")
        update_memory("event_created", data)
        print(f"[{_ts()}] [Swarm Memory] Event metadata stored.")
        run_social_agent(data)
        log_memory()
        update_agent_status("Orchestrator", "idle", 1)

    elif event == "crisis_detected":
        update_agent_status("Orchestrator", "active")
        update_agent_status("Crisis Agent", "active")
        log_controller("Crisis detected! Initiating response protocol.")
        log_activity_feed("Crisis Agent", "Detected potential scheduling conflict due to speaker emergency")
        
        # Simulate some logic
        update_agent_status("Scheduler Agent", "active")
        log_activity_feed("Scheduler Agent", "Recalculating alternative slots for affected sessions")
        
        run_email_agent({"priority": "high", "type": "crisis_notification"})
        log_activity_feed("Crisis Agent", "Mitigation plan coordinated with Scheduler and Email agents")
        
        update_agent_status("Crisis Agent", "idle", 1)
        update_agent_status("Scheduler Agent", "idle", 1)
        update_agent_status("Orchestrator", "idle", 1)

    log_controller(f"Orchestration for '{event}' completed.")
    return ai_insight
