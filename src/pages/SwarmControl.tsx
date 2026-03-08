import { useState, useEffect, useCallback, useRef } from "react";
import {
  Cpu, Bot, CheckCircle2, Loader2, AlertTriangle, Play, RotateCcw,
  Zap, Mail, Share2, CalendarClock, BarChart3, ShieldAlert, Network,
  ArrowRight, Circle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ── Agent Definitions ──
interface Agent {
  id: string;
  name: string;
  icon: any;
  color: string;
  dotColor: string;
  bgColor: string;
  status: "active" | "idle" | "processing";
  tasksCompleted: number;
  currentTask: string;
  x: number;
  y: number;
}

interface Connection {
  from: string;
  to: string;
  label?: string;
}

interface FlowMessage {
  id: string;
  from: string;
  to: string;
  label: string;
  progress: number; // 0-1
  color: string;
}

interface ActivityLog {
  timestamp: string;
  from: string;
  to: string;
  message: string;
  type: "command" | "data" | "alert" | "notification";
}

const AGENT_DEFS: Omit<Agent, "status" | "currentTask">[] = [
  { id: "orchestrator", name: "Orchestrator", icon: Cpu, color: "text-primary", dotColor: "bg-primary", bgColor: "bg-primary/10", tasksCompleted: 1247, x: 50, y: 15 },
  { id: "content", name: "Content Agent", icon: Share2, color: "text-neon-rose", dotColor: "bg-neon-rose", bgColor: "bg-neon-rose/10", tasksCompleted: 326, x: 15, y: 45 },
  { id: "email", name: "Email Agent", icon: Mail, color: "text-neon-cyan", dotColor: "bg-neon-cyan", bgColor: "bg-neon-cyan/10", tasksCompleted: 892, x: 50, y: 45 },
  { id: "scheduler", name: "Scheduler Agent", icon: CalendarClock, color: "text-neon-green", dotColor: "bg-neon-green", bgColor: "bg-neon-green/10", tasksCompleted: 67, x: 85, y: 45 },
  { id: "analytics", name: "Analytics Agent", icon: BarChart3, color: "text-neon-purple", dotColor: "bg-neon-purple", bgColor: "bg-neon-purple/10", tasksCompleted: 189, x: 25, y: 80 },
  { id: "crisis", name: "Crisis Agent", icon: ShieldAlert, color: "text-neon-amber", dotColor: "bg-neon-amber", bgColor: "bg-neon-amber/10", tasksCompleted: 12, x: 75, y: 80 },
];

const CONNECTIONS: Connection[] = [
  { from: "orchestrator", to: "content", label: "content tasks" },
  { from: "orchestrator", to: "email", label: "email campaigns" },
  { from: "orchestrator", to: "scheduler", label: "schedule ops" },
  { from: "orchestrator", to: "analytics", label: "data requests" },
  { from: "orchestrator", to: "crisis", label: "crisis alerts" },
  { from: "email", to: "analytics", label: "delivery stats" },
  { from: "scheduler", to: "crisis", label: "conflict data" },
  { from: "content", to: "email", label: "email content" },
  { from: "crisis", to: "scheduler", label: "reschedule" },
  { from: "crisis", to: "email", label: "notifications" },
];

const FLOW_SCENARIOS = [
  {
    name: "Email Campaign",
    steps: [
      { from: "orchestrator", to: "content", label: "Generate email content" },
      { from: "content", to: "email", label: "Content ready" },
      { from: "email", to: "analytics", label: "Delivery report" },
    ],
  },
  {
    name: "Crisis Response",
    steps: [
      { from: "orchestrator", to: "crisis", label: "Crisis detected!" },
      { from: "crisis", to: "scheduler", label: "Reschedule sessions" },
      { from: "crisis", to: "email", label: "Notify participants" },
      { from: "email", to: "analytics", label: "Notification stats" },
    ],
  },
  {
    name: "Social Campaign",
    steps: [
      { from: "orchestrator", to: "content", label: "Generate social posts" },
      { from: "content", to: "analytics", label: "Engagement tracking" },
      { from: "orchestrator", to: "email", label: "Promote via email" },
    ],
  },
  {
    name: "Schedule Optimization",
    steps: [
      { from: "orchestrator", to: "scheduler", label: "Optimize schedule" },
      { from: "scheduler", to: "crisis", label: "Check conflicts" },
      { from: "scheduler", to: "email", label: "Schedule updates" },
      { from: "email", to: "analytics", label: "Open rates" },
    ],
  },
];

const SwarmControl = () => {
  const [agents, setAgents] = useState<Agent[]>(
    AGENT_DEFS.map(a => ({ ...a, status: "idle" as const, currentTask: "Standing by" }))
  );
  const [flowMessages, setFlowMessages] = useState<FlowMessage[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const flowIdCounter = useRef(0);

  // Auto-run idle animations
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRunning) {
        // Random status flickers
        setAgents(prev => prev.map(a => ({
          ...a,
          tasksCompleted: a.tasksCompleted + (Math.random() > 0.7 ? 1 : 0),
        })));
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Animate flow messages
  useEffect(() => {
    const animate = () => {
      setFlowMessages(prev => {
        const updated = prev.map(m => ({ ...m, progress: m.progress + 0.02 }));
        return updated.filter(m => m.progress <= 1);
      });
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); };
  }, []);

  const addLog = useCallback((from: string, to: string, message: string, type: ActivityLog["type"] = "command") => {
    setActivityLog(prev => [{
      timestamp: new Date().toLocaleTimeString(),
      from, to, message, type,
    }, ...prev].slice(0, 50));
  }, []);

  const spawnFlow = useCallback((from: string, to: string, label: string, color: string) => {
    const id = `flow-${flowIdCounter.current++}`;
    setFlowMessages(prev => [...prev, { id, from, to, label, progress: 0, color }]);
  }, []);

  const runScenario = useCallback(async (scenario: typeof FLOW_SCENARIOS[0]) => {
    setIsRunning(true);
    setActiveScenario(scenario.name);

    for (const step of scenario.steps) {
      const fromAgent = AGENT_DEFS.find(a => a.id === step.from);
      const toAgent = AGENT_DEFS.find(a => a.id === step.to);

      // Set agents active
      setAgents(prev => prev.map(a =>
        a.id === step.from ? { ...a, status: "processing" as const, currentTask: `Sending: ${step.label}` } :
        a.id === step.to ? { ...a, status: "processing" as const, currentTask: `Receiving: ${step.label}` } :
        a
      ));

      const color = fromAgent?.dotColor.replace("bg-", "") || "primary";
      spawnFlow(step.from, step.to, step.label, color);
      addLog(fromAgent?.name || step.from, toAgent?.name || step.to, step.label, "command");

      await new Promise(r => setTimeout(r, 1800));

      // Complete step
      setAgents(prev => prev.map(a =>
        a.id === step.from ? { ...a, status: "active" as const, currentTask: "Task complete", tasksCompleted: a.tasksCompleted + 1 } :
        a.id === step.to ? { ...a, status: "active" as const, currentTask: step.label } :
        a
      ));
    }

    await new Promise(r => setTimeout(r, 1000));

    // Reset all to idle
    setAgents(prev => prev.map(a => ({ ...a, status: "idle" as const, currentTask: "Standing by" })));
    setIsRunning(false);
    setActiveScenario(null);
  }, [spawnFlow, addLog]);

  // SVG helpers
  const getAgentCenter = (agentId: string) => {
    const a = AGENT_DEFS.find(d => d.id === agentId);
    if (!a) return { x: 0, y: 0 };
    return { x: a.x, y: a.y };
  };

  const getFlowPosition = (msg: FlowMessage) => {
    const from = getAgentCenter(msg.from);
    const to = getAgentCenter(msg.to);
    return {
      x: from.x + (to.x - from.x) * msg.progress,
      y: from.y + (to.y - from.y) * msg.progress,
    };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Swarm Control Center</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">Real-time AI agent network visualization & operations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Agents Online", value: agents.length, icon: Bot, color: "text-neon-cyan" },
          { label: "Active Now", value: agents.filter(a => a.status !== "idle").length, icon: Loader2, color: "text-neon-green" },
          { label: "Total Tasks", value: agents.reduce((s, a) => s + a.tasksCompleted, 0).toLocaleString(), icon: CheckCircle2, color: "text-neon-purple" },
          { label: "Connections", value: CONNECTIONS.length, icon: Network, color: "text-neon-amber" },
        ].map((s, i) => (
          <div key={s.label} className="glass-card rounded-xl p-4 animate-fade-in" style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
            <div className={`${s.color} mb-2`}><s.icon className="h-4 w-4" /></div>
            <p className="text-xl font-bold font-mono">{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Network Visualization */}
      <Card className="glass-card overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Network className="h-4 w-4 text-primary" />
              Agent Network
              {activeScenario && (
                <Badge className="ml-2 animate-pulse bg-primary/20 text-primary border-primary/30">
                  {activeScenario}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              {isRunning && (
                <span className="text-[10px] font-mono text-neon-cyan flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-neon-cyan animate-pulse" />
                  SIMULATING
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full" style={{ paddingBottom: "55%" }}>
            <svg
              ref={svgRef}
              viewBox="0 0 100 95"
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Connection Lines */}
              {CONNECTIONS.map((conn, i) => {
                const from = getAgentCenter(conn.from);
                const to = getAgentCenter(conn.to);
                const isActive = flowMessages.some(m =>
                  (m.from === conn.from && m.to === conn.to) ||
                  (m.from === conn.to && m.to === conn.from)
                );
                return (
                  <g key={i}>
                    <line
                      x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                      stroke={isActive ? "hsl(var(--primary))" : "hsl(var(--border))"}
                      strokeWidth={isActive ? 0.4 : 0.15}
                      strokeDasharray={isActive ? "none" : "1 1"}
                      opacity={isActive ? 0.8 : 0.4}
                      style={{ transition: "all 0.3s ease" }}
                    />
                    {isActive && (
                      <line
                        x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                        stroke="hsl(var(--primary))"
                        strokeWidth={0.8}
                        opacity={0.15}
                        filter="url(#glow)"
                      />
                    )}
                  </g>
                );
              })}

              {/* Flow Particles */}
              {flowMessages.map(msg => {
                const pos = getFlowPosition(msg);
                return (
                  <g key={msg.id}>
                    <circle cx={pos.x} cy={pos.y} r={1.2} fill="hsl(var(--primary))" opacity={0.3} />
                    <circle cx={pos.x} cy={pos.y} r={0.6} fill="hsl(var(--primary))" filter="url(#glow)" />
                    <text
                      x={pos.x} y={pos.y - 2}
                      textAnchor="middle"
                      fill="hsl(var(--muted-foreground))"
                      fontSize="1.8"
                      fontFamily="monospace"
                    >
                      {msg.label}
                    </text>
                  </g>
                );
              })}

              {/* Agent Nodes */}
              {agents.map(agent => {
                const isProcessing = agent.status === "processing";
                const isActive = agent.status === "active";
                return (
                  <g key={agent.id}>
                    {/* Pulse ring for active/processing */}
                    {(isProcessing || isActive) && (
                      <circle
                        cx={agent.x} cy={agent.y} r={5}
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth={0.2}
                        opacity={0.4}
                      >
                        <animate attributeName="r" from="4" to="7" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}

                    {/* Node background */}
                    <circle
                      cx={agent.x} cy={agent.y} r={4}
                      fill="hsl(var(--card))"
                      stroke={isProcessing ? "hsl(var(--primary))" : isActive ? "hsl(var(--neon-green))" : "hsl(var(--border))"}
                      strokeWidth={isProcessing ? 0.4 : 0.2}
                      style={{ transition: "all 0.3s ease" }}
                    />

                    {/* Icon placeholder (small circle) */}
                    <circle
                      cx={agent.x} cy={agent.y}
                      r={1.5}
                      fill={isProcessing ? "hsl(var(--primary))" : isActive ? "hsl(var(--neon-green))" : "hsl(var(--muted-foreground))"}
                      opacity={0.6}
                    />

                    {/* Label */}
                    <text
                      x={agent.x} y={agent.y + 7}
                      textAnchor="middle"
                      fill="hsl(var(--foreground))"
                      fontSize="2.2"
                      fontWeight="600"
                    >
                      {agent.name}
                    </text>

                    {/* Status indicator */}
                    <circle
                      cx={agent.x + 3} cy={agent.y - 3}
                      r={0.8}
                      fill={isProcessing ? "hsl(var(--primary))" : isActive ? "hsl(var(--neon-green))" : "hsl(var(--muted-foreground))"}
                    >
                      {(isProcessing || isActive) && (
                        <animate attributeName="opacity" from="1" to="0.3" dur="1s" repeatCount="indefinite" />
                      )}
                    </circle>
                  </g>
                );
              })}
            </svg>
          </div>
        </CardContent>
      </Card>

      {/* Scenario Triggers + Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Scenario Buttons */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="h-4 w-4 text-neon-green" />
              Simulate Agent Flow
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {FLOW_SCENARIOS.map(scenario => (
              <Button
                key={scenario.name}
                variant="outline"
                className="w-full justify-between text-left h-auto py-3"
                disabled={isRunning}
                onClick={() => runScenario(scenario)}
              >
                <div>
                  <p className="text-sm font-medium">{scenario.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    {scenario.steps.map(s => {
                      const name = AGENT_DEFS.find(a => a.id === s.from)?.name || s.from;
                      return name;
                    }).filter((v, i, a) => a.indexOf(v) === i).join(" → ")}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-4 w-4 text-neon-amber" />
              Live Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activityLog.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Run a simulation to see agent communication.</p>
            ) : (
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {activityLog.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs animate-fade-in">
                    <span className="text-[10px] font-mono text-muted-foreground w-16 shrink-0">{log.timestamp}</span>
                    <div className="flex items-center gap-1 min-w-0">
                      <Badge variant="secondary" className="text-[9px] shrink-0 px-1.5">{log.from}</Badge>
                      <ArrowRight className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                      <Badge variant="secondary" className="text-[9px] shrink-0 px-1.5">{log.to}</Badge>
                      <span className="text-muted-foreground truncate ml-1">{log.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agent Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {agents.map((agent, i) => {
          const Icon = agent.icon;
          return (
            <div
              key={agent.id}
              className={`glass-card rounded-xl p-4 animate-fade-in transition-all duration-300 ${
                agent.status === "processing" ? "ring-1 ring-primary/50" :
                agent.status === "active" ? "ring-1 ring-neon-green/30" : ""
              }`}
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${agent.bgColor}`}>
                    <Icon className={`h-3.5 w-3.5 ${agent.color}`} />
                  </div>
                  <span className="text-sm font-semibold">{agent.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full ${
                    agent.status === "processing" ? "bg-primary/10 text-primary" :
                    agent.status === "active" ? "bg-neon-green/10 text-neon-green" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {agent.status}
                  </span>
                  <div className={`h-1.5 w-1.5 rounded-full ${
                    agent.status === "processing" ? "bg-primary animate-pulse" :
                    agent.status === "active" ? "bg-neon-green animate-pulse" :
                    "bg-muted-foreground"
                  }`} />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">{agent.currentTask}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-muted-foreground font-mono">{agent.tasksCompleted} tasks</span>
                {agent.status === "processing" && (
                  <Loader2 className="h-3 w-3 text-primary animate-spin" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SwarmControl;
