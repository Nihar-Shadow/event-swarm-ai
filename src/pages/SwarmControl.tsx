import { Cpu, Bot, CheckCircle2, Loader2, AlertTriangle, Pause, Play, RotateCcw } from "lucide-react";

const agents = [
  { name: "Content Generator", status: "active", task: "Writing blog post for TechSummit 2026", progress: 72, tasksCompleted: 143 },
  { name: "Email Orchestrator", status: "active", task: "Sending batch invites (432/500)", progress: 86, tasksCompleted: 298 },
  { name: "Schedule Optimizer", status: "idle", task: "Waiting for new conflicts", progress: 100, tasksCompleted: 67 },
  { name: "Engagement Analyst", status: "active", task: "Analyzing registration trends", progress: 45, tasksCompleted: 89 },
  { name: "Disruption Handler", status: "warning", task: "Speaker cancellation — reassigning", progress: 15, tasksCompleted: 12 },
  { name: "Participant Manager", status: "idle", task: "All records synchronized", progress: 100, tasksCompleted: 412 },
  { name: "Social Media Agent", status: "active", task: "Generating Twitter thread drafts", progress: 58, tasksCompleted: 326 },
  { name: "Budget Tracker", status: "idle", task: "Monthly report generated", progress: 100, tasksCompleted: 24 },
];

const statusConfig = {
  active: { icon: Loader2, color: "text-neon-cyan", dot: "bg-neon-cyan", label: "ACTIVE", iconClass: "animate-spin" },
  idle: { icon: CheckCircle2, color: "text-neon-green", dot: "bg-neon-green", label: "IDLE", iconClass: "" },
  warning: { icon: AlertTriangle, color: "text-neon-amber", dot: "bg-neon-amber", label: "ALERT", iconClass: "" },
};

const SwarmControl = () => (
  <div className="space-y-6 max-w-7xl mx-auto">
    <div className="animate-fade-in">
      <div className="flex items-center gap-2">
        <Cpu className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Swarm Control Center</h1>
      </div>
      <p className="text-sm text-muted-foreground mt-1">Monitor, pause, and manage all AI agents</p>
    </div>

    {/* Summary row */}
    <div className="grid grid-cols-3 gap-4">
      {[
        { label: "Active", value: agents.filter(a => a.status === "active").length, color: "text-neon-cyan" },
        { label: "Idle", value: agents.filter(a => a.status === "idle").length, color: "text-neon-green" },
        { label: "Alerts", value: agents.filter(a => a.status === "warning").length, color: "text-neon-amber" },
      ].map((s) => (
        <div key={s.label} className="glass-card rounded-xl p-4 text-center">
          <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
        </div>
      ))}
    </div>

    {/* Agent cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {agents.map((agent, i) => {
        const cfg = statusConfig[agent.status as keyof typeof statusConfig];
        const Icon = cfg.icon;
        return (
          <div
            key={agent.name}
            className={`glass-card rounded-xl p-5 animate-fade-in ${agent.status === "warning" ? "neon-border border-neon-amber/30" : ""}`}
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">{agent.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                  agent.status === "active" ? "bg-neon-cyan/10 text-neon-cyan" :
                  agent.status === "idle" ? "bg-neon-green/10 text-neon-green" :
                  "bg-neon-amber/10 text-neon-amber"
                }`}>{cfg.label}</span>
                <div className={`${cfg.dot} h-2 w-2 rounded-full animate-pulse-slow`} />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{agent.task}</p>
            <div className="h-1.5 w-full rounded-full bg-muted mb-3">
              <div className="h-full rounded-full bg-primary transition-all duration-1000" style={{ width: `${agent.progress}%` }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-mono">{agent.tasksCompleted} tasks completed</span>
              <div className="flex items-center gap-1">
                <button className="p-1.5 rounded-md hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground">
                  <Pause className="h-3 w-3" />
                </button>
                <button className="p-1.5 rounded-md hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground">
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default SwarmControl;
