import { Bot, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";

const agents = [
  { name: "Content Generator", status: "active", task: "Writing blog post for TechSummit 2026", progress: 72 },
  { name: "Email Orchestrator", status: "active", task: "Sending batch invites (432/500)", progress: 86 },
  { name: "Schedule Optimizer", status: "idle", task: "Waiting for new conflicts", progress: 100 },
  { name: "Engagement Analyst", status: "active", task: "Analyzing registration trends", progress: 45 },
  { name: "Disruption Handler", status: "warning", task: "Speaker cancellation detected", progress: 15 },
  { name: "Participant Manager", status: "idle", task: "All records synchronized", progress: 100 },
];

const statusConfig = {
  active: { icon: Loader2, color: "text-neon-cyan", dot: "bg-neon-cyan", iconClass: "animate-spin" },
  idle: { icon: CheckCircle2, color: "text-neon-green", dot: "bg-neon-green", iconClass: "" },
  warning: { icon: AlertTriangle, color: "text-neon-amber", dot: "bg-neon-amber", iconClass: "" },
};

export function AgentStatus() {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Bot className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">AI Agent Swarm</h3>
        <span className="ml-auto text-xs text-muted-foreground font-mono">6 AGENTS</span>
      </div>
      <div className="space-y-3">
        {agents.map((agent, i) => {
          const cfg = statusConfig[agent.status as keyof typeof statusConfig];
          const Icon = cfg.icon;
          return (
            <div
              key={agent.name}
              className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 animate-fade-in"
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
            >
              <div className={`mt-0.5 ${cfg.color}`}>
                <Icon className={`h-4 w-4 ${cfg.iconClass}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{agent.name}</p>
                  <div className={`h-1.5 w-1.5 rounded-full ${cfg.dot} animate-pulse-slow`} />
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{agent.task}</p>
                <div className="mt-2 h-1 w-full rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-1000"
                    style={{ width: `${agent.progress}%` }}
                  />
                </div>
              </div>
              <span className="text-xs font-mono text-muted-foreground">{agent.progress}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
