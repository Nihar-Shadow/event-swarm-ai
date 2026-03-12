from datetime import datetime
from swarm_memory import update_memory, get_memory


# ─────────────────────────────────────────────────
#  Reasoning Agent — Scheduling Decision Explainer
# ─────────────────────────────────────────────────

def _ts() -> str:
    return datetime.now().strftime("%I:%M:%S %p").lstrip("0")


def _log(msg: str) -> None:
    print(f"[{_ts()}] [Reasoning Agent] {msg}")


def _conflict_reason_text(conflict_type: str) -> str:
    mapping = {
        "room":         "a room conflict (the requested room was already occupied)",
        "speaker":      "a speaker double-booking conflict (the speaker was already assigned to another session)",
        "availability": "a speaker availability constraint (the speaker was not yet available at the preferred time)",
    }
    return mapping.get(conflict_type, "an unspecified scheduling conflict")


def run_reasoning_agent() -> str:
    """
    Reads the latest schedule from swarm memory, analyses every session,
    detects mismatches between preferred and allocated times, and generates
    a structured human-readable AI insight.

    Returns the generated insight string so the swarm controller can
    optionally append it to the scheduler log visible in the UI.
    """
    _log("Analyzing scheduling decisions")

    schedule_update = get_memory("last_schedule_update")

    if not schedule_update:
        _log("No schedule found in swarm memory — skipping analysis.")
        return ""

    _log(f"Found {len(schedule_update)} session(s) to analyse")

    conflict_lines = []
    ok_lines = []

    for slot in schedule_update:
        session_name    = slot.get("session", "Unknown Session")
        preferred_time  = slot.get("preferred_time") or slot.get("scheduled_start", "N/A")
        scheduled_start = slot.get("scheduled_start", "N/A")
        scheduled_end   = slot.get("scheduled_end", "N/A")
        conflict_type   = slot.get("conflict_type")
        has_conflict    = slot.get("has_conflict", False)

        if has_conflict and conflict_type:
            reason = _conflict_reason_text(conflict_type)
            _log(f"Conflict detected for '{session_name}': preferred {preferred_time}, moved to {scheduled_start} due to {conflict_type}")
            conflict_lines.append(
                f'• "{session_name}" was requested at {preferred_time} but was moved to '
                f'{scheduled_start}–{scheduled_end} due to {reason}.'
            )
        else:
            ok_lines.append(
                f'• "{session_name}" was successfully scheduled at {scheduled_start}–{scheduled_end} with no conflicts.'
            )

    # ── Build the full explanation ──────────────────────────────────
    sections = ["📋 AI Reasoning Report\n"]

    if conflict_lines:
        sections.append("🔴 Conflicts Detected & Resolved:")
        sections.extend(conflict_lines)
        sections.append(
            "\nThe scheduler automatically moved conflicting sessions to the next "
            "available time slot while respecting room capacity and speaker availability windows."
        )
    else:
        sections.append("✅ No conflicts were detected.")

    if ok_lines:
        sections.append("\n🟢 Sessions Scheduled Without Issues:")
        sections.extend(ok_lines)

    # Summary
    total        = len(schedule_update)
    n_conflicts  = len(conflict_lines)
    n_clean      = len(ok_lines)
    sections.append(
        f"\n📊 Summary: {total} session(s) processed — "
        f"{n_conflicts} conflict(s) resolved, {n_clean} scheduled cleanly."
    )

    explanation = "\n".join(sections)

    _log("Explanation generated")

    # ── Store in swarm memory ───────────────────────────────────────
    update_memory("ai_insight", explanation)
    print(f"[{_ts()}] [Swarm Memory] 'ai_insight' updated")

    from main import log_swarm_event_sync
    log_swarm_event_sync("Reasoning Agent", "analysis_completed", "Generated AI reasoning report")

    return explanation
