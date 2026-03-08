import { CalendarClock, Clock, MapPin, AlertTriangle, CheckCircle2 } from "lucide-react";

const days = ["Day 1 — Mar 15", "Day 2 — Mar 16", "Day 3 — Mar 17"];

const scheduleByDay: Record<string, Array<{ time: string; title: string; speaker: string; track: string; conflict?: boolean }>> = {
  "Day 1 — Mar 15": [
    { time: "09:00", title: "Opening Keynote", speaker: "Dr. Sarah Chen", track: "Main Stage" },
    { time: "10:30", title: "AI in Production", speaker: "Marcus Rivera", track: "Track A" },
    { time: "10:30", title: "Scaling Microservices", speaker: "Lina Nakamura", track: "Track B", conflict: true },
    { time: "12:00", title: "Lunch & Networking", speaker: "", track: "All" },
    { time: "13:30", title: "Workshop: LLM Fine-Tuning", speaker: "Alex Petrov", track: "Workshop Hall" },
    { time: "15:00", title: "Panel: Future of DevOps", speaker: "Multiple Speakers", track: "Main Stage" },
    { time: "17:00", title: "Lightning Talks", speaker: "Community", track: "Track A" },
  ],
  "Day 2 — Mar 16": [
    { time: "09:00", title: "Day 2 Keynote: Edge Computing", speaker: "Priya Sharma", track: "Main Stage" },
    { time: "10:30", title: "Hackathon Kickoff", speaker: "", track: "Workshop Hall" },
    { time: "12:00", title: "Lunch Break", speaker: "", track: "All" },
    { time: "13:30", title: "Cloud Architecture Deep Dive", speaker: "Tom Bradley", track: "Track A" },
    { time: "15:00", title: "Security in AI Systems", speaker: "Kenji Watanabe", track: "Track B" },
  ],
  "Day 3 — Mar 17": [
    { time: "09:00", title: "Hackathon Demos", speaker: "Teams", track: "Main Stage" },
    { time: "11:00", title: "Awards Ceremony", speaker: "", track: "Main Stage" },
    { time: "12:00", title: "Closing Lunch", speaker: "", track: "All" },
  ],
};

const Scheduler = () => (
  <div className="space-y-6 max-w-5xl mx-auto">
    <div className="animate-fade-in">
      <div className="flex items-center gap-2">
        <CalendarClock className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Event Scheduler</h1>
      </div>
      <p className="text-sm text-muted-foreground mt-1">TechSummit 2026 — AI-optimized schedule</p>
    </div>

    {days.map((day, di) => (
      <div key={day} className="animate-fade-in" style={{ animationDelay: `${di * 100}ms`, animationFillMode: "both" }}>
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <CalendarClock className="h-3.5 w-3.5 text-primary" />
          {day}
        </h2>
        <div className="space-y-2 mb-6">
          {scheduleByDay[day].map((s, i) => (
            <div
              key={i}
              className={`glass-card rounded-xl p-4 flex items-center gap-4 ${s.conflict ? "neon-border border-neon-amber/40" : ""}`}
            >
              <div className="text-sm font-mono text-muted-foreground w-14 shrink-0 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {s.time}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{s.title}</p>
                {s.speaker && <p className="text-xs text-muted-foreground">{s.speaker}</p>}
              </div>
              <span className="text-xs font-mono text-muted-foreground hidden sm:block">{s.track}</span>
              {s.conflict ? (
                <span className="flex items-center gap-1 text-[10px] font-mono text-neon-amber px-2 py-0.5 rounded bg-neon-amber/10">
                  <AlertTriangle className="h-3 w-3" /> CONFLICT
                </span>
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-neon-green shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default Scheduler;
