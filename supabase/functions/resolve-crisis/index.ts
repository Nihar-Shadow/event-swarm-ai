import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { crisis_type, affected_entity, sessions, rooms, speakers, event_date } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a Crisis Management AI agent for live events. When a crisis occurs, you must:
1. Analyze the impact on the current schedule
2. Propose a corrected schedule that resolves the crisis
3. Identify which participants need to be notified
4. Provide detailed agent action logs

Crisis types you handle:
- speaker_cancellation: A speaker can no longer attend. Their sessions need reassignment or cancellation.
- session_delay: A session is running late. Cascade effects on following sessions must be resolved.
- room_unavailability: A room is no longer available. Sessions in that room must be relocated.

You MUST respond with valid JSON (no markdown fences):
{
  "analysis": "Brief analysis of the crisis impact",
  "actions": [
    {
      "session_id": "uuid",
      "action": "reschedule|cancel|relocate|delay",
      "new_start_time": "ISO datetime or null",
      "new_end_time": "ISO datetime or null",
      "new_room_id": "uuid or null",
      "note": "explanation"
    }
  ],
  "notifications": [
    {
      "type": "schedule_change|cancellation|room_change|delay",
      "message": "Notification message for participants",
      "affected_sessions": ["session titles"]
    }
  ],
  "logs": [
    "[Crisis Agent] Speaker cancellation detected for Dr. X",
    "[Scheduler Agent] Recalculating schedule...",
    "[Scheduler Agent] Moved Session Y to Room Z",
    "[Email Agent] Notifying 45 participants of schedule change"
  ]
}`;

    const sessionList = sessions.map((s: any) =>
      `- "${s.title}" (id: ${s.id}) | Speaker: ${s.speaker_name || "TBD"} (speaker_id: ${s.speaker_id || "none"}) | Room: ${s.room_name || "unassigned"} (room_id: ${s.room_id || "none"}) | Time: ${s.start_time || "unscheduled"} to ${s.end_time || "unscheduled"} | Duration: ${s.duration_minutes}min | Participants: ~${s.participant_count || 50}`
    ).join("\n");

    const roomList = rooms.map((r: any) => `- "${r.name}" (id: ${r.id}, capacity: ${r.capacity || "unknown"})`).join("\n");
    const speakerList = speakers.map((sp: any) => `- "${sp.name}" (id: ${sp.id}, topic: ${sp.topic || "general"})`).join("\n");

    const crisisDescriptions: Record<string, string> = {
      speaker_cancellation: `CRISIS: Speaker "${affected_entity.name}" (id: ${affected_entity.id}) has cancelled. All their sessions must be reassigned to another speaker or cancelled.`,
      session_delay: `CRISIS: Session "${affected_entity.title}" (id: ${affected_entity.id}) is delayed by ${affected_entity.delay_minutes || 30} minutes. Resolve cascading conflicts.`,
      room_unavailability: `CRISIS: Room "${affected_entity.name}" (id: ${affected_entity.id}) is no longer available. All sessions in this room must be relocated.`,
    };

    const userPrompt = `${crisisDescriptions[crisis_type] || "Unknown crisis type."}

Event date: ${event_date || "2026-03-15"}

Current sessions:
${sessionList}

Available rooms:
${roomList}

Available speakers:
${speakerList}

Resolve this crisis with minimal disruption. Prefer rescheduling over cancellation.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        analysis: "Could not parse AI response.",
        actions: [],
        notifications: [],
        logs: ["[Crisis Agent] Failed to parse AI response — manual intervention needed"],
      };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("resolve-crisis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
