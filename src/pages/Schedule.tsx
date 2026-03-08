import { Activity, Clock } from "lucide-react";

const slots = [
  { time: "09:00", title: "Opening Keynote", speaker: "Dr. Sarah Chen", track: "Main Stage", conflict: false },
  { time: "10:30", title: "AI in Production", speaker: "Marcus Rivera", track: "Track A", conflict: false },
  { time: "10:30", title: "Scaling Microservices", speaker: "Lina Nakamura", track: "Track B", conflict: true },
  { time: "12:00", title: "Lunch & Networking", speaker: "", track: "All", conflict: false },
  { time: "13:30", title: "Workshop: LLM Fine-Tuning", speaker: "Alex Petrov", track: "Workshop Hall", conflict: false },
  { time: "15:00", title: "Panel: Future of DevOps", speaker: "Multiple", track: "Main Stage", conflict: false },
];

const Schedule = () => (
  <div className="space-y-6 max-w-5xl mx-auto">
    <div className="animate-fade-in">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
      </div>
      <p className="text-sm text-muted-foreground mt-1">TechSummit 2026 — Day 1</p>
    </div>
    <div className="space-y-2">
      {slots.map((s, i) => (
        <div
          key={i}
          className={`glass-card rounded-xl p-4 flex items-center gap-4 animate-fade-in ${s.conflict ? "neon-border border-neon-amber/40" : ""}`}
          style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
        >
          <div className="text-sm font-mono text-muted-foreground w-14 shrink-0 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {s.time}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{s.title}</p>
            {s.speaker && <p className="text-xs text-muted-foreground">{s.speaker}</p>}
          </div>
          <span className="text-xs font-mono text-muted-foreground">{s.track}</span>
          {s.conflict && <span className="text-[10px] font-mono text-neon-amber px-2 py-0.5 rounded bg-neon-amber/10">CONFLICT</span>}
        </div>
      ))}
    </div>
  </div>
);

export default Schedule;
