import { Zap, Mail, Calendar, AlertTriangle, Users, FileText } from "lucide-react";

const activities = [
  { time: "2 min ago", icon: AlertTriangle, color: "text-neon-amber", msg: "Disruption Handler flagged speaker conflict for Track B" },
  { time: "8 min ago", icon: Mail, color: "text-neon-purple", msg: "Email Orchestrator sent 432 personalized invites" },
  { time: "15 min ago", icon: FileText, color: "text-neon-cyan", msg: "Content Generator published promo for TechSummit 2026" },
  { time: "22 min ago", icon: Calendar, color: "text-neon-green", msg: "Schedule Optimizer resolved 3 time-slot conflicts" },
  { time: "35 min ago", icon: Users, color: "text-neon-cyan", msg: "Participant Manager synced 156 new registrations" },
  { time: "1 hr ago", icon: Zap, color: "text-neon-amber", msg: "Engagement Analyst detected 23% drop in Track C interest" },
  { time: "2 hr ago", icon: Mail, color: "text-neon-purple", msg: "Email Orchestrator completed follow-up campaign" },
];

export function ActivityLog() {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Activity Log</h3>
        <span className="ml-auto text-xs text-muted-foreground font-mono">LIVE</span>
      </div>
      <div className="space-y-1">
        {activities.map((a, i) => (
          <div
            key={i}
            className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors animate-fade-in"
            style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
          >
            <div className={`mt-0.5 ${a.color}`}>
              <a.icon className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs leading-relaxed">{a.msg}</p>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">{a.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
