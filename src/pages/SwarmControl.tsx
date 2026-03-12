import { useState, useEffect, useCallback, useRef } from "react";
import {
  Cpu, Bot, CheckCircle2, Loader2, AlertTriangle, Play, RotateCcw,
  Zap, Mail, Share2, CalendarClock, BarChart3, ShieldAlert, Network,
  ArrowRight, Circle, Database
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// ── Agent Definitions ──
interface Agent {
  name: string;
  status: "active" | "idle" | "processing";
  tasks: number;
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
  agent: string;
  message: string;
  time: string;
  timestamp: string;
}

interface SwarmMemory {
  last_schedule_update: number;
  generated_posts: number;
  email_notifications: number;
  participants: number;
}

const AGENT_MAP: Record<string, { id: string; icon: any; color: string; dotColor: string; bgColor: string; x: number; y: number }> = {
  "Orchestrator": { id: "orchestrator", icon: Cpu, color: "text-primary", dotColor: "bg-primary", bgColor: "bg-primary/10", x: 50, y: 15 },
  "Social Media Agent": { id: "social", icon: Share2, color: "text-neon-rose", dotColor: "bg-neon-rose", bgColor: "bg-neon-rose/10", x: 15, y: 45 },
  "Email Agent": { id: "email", icon: Mail, color: "text-neon-cyan", dotColor: "bg-neon-cyan", bgColor: "bg-neon-cyan/10", x: 50, y: 45 },
  "Scheduler Agent": { id: "scheduler", icon: CalendarClock, color: "text-neon-green", dotColor: "bg-neon-green", bgColor: "bg-neon-green/10", x: 85, y: 45 },
  "Reasoning Agent": { id: "reasoning", icon: Bot, color: "text-neon-purple", dotColor: "bg-neon-purple", bgColor: "bg-neon-purple/10", x: 25, y: 80 },
  "Analytics Agent": { id: "analytics", icon: BarChart3, color: "text-neon-purple", dotColor: "bg-neon-purple", bgColor: "bg-neon-purple/10", x: 50, y: 80 },
  "Crisis Agent": { id: "crisis", icon: ShieldAlert, color: "text-neon-amber", dotColor: "bg-neon-amber", bgColor: "bg-neon-amber/10", x: 75, y: 80 },
  "Swarm Memory": { id: "memory", icon: Database, color: "text-neon-cyan", dotColor: "bg-neon-cyan", bgColor: "bg-neon-cyan/10", x: 92, y: 15 },
};

const CONNECTIONS: Connection[] = [
  { from: "Scheduler Agent", to: "Orchestrator" },
  { from: "Orchestrator", to: "Email Agent" },
  { from: "Orchestrator", to: "Social Media Agent" },
  { from: "Orchestrator", to: "Reasoning Agent" },
  { from: "Orchestrator", to: "Analytics Agent" },
  { from: "Orchestrator", to: "Crisis Agent" },
  { from: "Email Agent", to: "Analytics Agent" },
  { from: "Scheduler Agent", to: "Crisis Agent" },
  { from: "Crisis Agent", to: "Email Agent" },
  { from: "Orchestrator", to: "Swarm Memory" },
];

const WORKFLOWS = [
  { id: "email_campaign", name: "Email Campaign", icon: Mail },
  { id: "crisis_response", name: "Crisis Response", icon: ShieldAlert },
  { id: "social_campaign", name: "Social Campaign", icon: Share2 },
  { id: "schedule_optimization", name: "Schedule Optimization", icon: CalendarClock },
];

const SwarmControl = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [status, setStatus] = useState({ agents_online: 0, active_now: 0, total_tasks: 0, connections: 10 });
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [memory, setMemory] = useState<SwarmMemory | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null);

  const [flowMessages, setFlowMessages] = useState<FlowMessage[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const flowIdCounter = useRef(0);

  const fetchSwarmData = useCallback(async () => {
    try {
      const [statusRes, agentsRes, activityRes, memoryRes] = await Promise.all([
        fetch("http://localhost:8000/api/swarm/status"),
        fetch("http://localhost:8000/api/swarm/agents"),
        fetch("http://localhost:8000/api/swarm/activity"),
        fetch("http://localhost:8000/api/swarm/memory")
      ]);

      if (statusRes.ok) setStatus(await statusRes.json());
      if (agentsRes.ok) setAgents(await agentsRes.json());
      if (activityRes.ok) setActivityLog(await activityRes.json());
      if (memoryRes.ok) setMemory(await memoryRes.json());
    } catch (error) {
      console.error("Failed to fetch swarm data:", error);
    }
  }, []);

  // Initial Load
  useEffect(() => {
    fetchSwarmData();
  }, [fetchSwarmData]);

  // WebSocket for Real-time Updates
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8000/ws/swarm");

    socket.onopen = () => {
      console.log("WebSocket connected to Swarm Control Center");
      toast.success("Real-time Swarm link established");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received swarm event:", data);

      // 1. Update Activity Feed
      setActivityLog(prev => [{
        agent: data.agent,
        message: data.message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        timestamp: data.timestamp
      }, ...prev].slice(0, 50));

      // 2. Update Agent Status & Highlight (Active for 3s)
      const isProcessing = data.event === "processing";
      setAgents(prev => prev.map(a =>
        a.name === data.agent
          ? { ...a, status: isProcessing ? "processing" : "active", tasks: a.tasks + 1 }
          : a
      ));

      // 3. Reset Status to idle after 3 seconds (unless it's a permanent state update)
      setTimeout(() => {
        setAgents(prev => prev.map(a =>
          a.name === data.agent && (a.status === "active" || a.status === "processing")
            ? { ...a, status: "idle" }
            : a
        ));
      }, 3000);

      // 4. Update Swarm Memory if present
      if (data.memory_update) {
        setMemory(prev => prev ? ({
          ...prev,
          ...data.memory_update
        }) : null);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
      toast.error("Swarm connection lost. Retrying...");
    };

    return () => socket.close();
  }, []);

  // Animate flow messages (visual only)
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

  const triggerWorkflow = async (workflowId: string) => {
    setIsRunning(true);
    setActiveWorkflow(workflowId);

    try {
      const res = await fetch("http://localhost:8000/api/swarm/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow: workflowId })
      });

      if (res.ok) {
        toast.success(`Workflow ${workflowId} triggered`);
        // Trigger immediate refresh after some delay to allow backend to process
        setTimeout(fetchSwarmData, 1000);
        setTimeout(fetchSwarmData, 3000);
      } else {
        toast.error("Failed to trigger workflow");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setTimeout(() => {
        setIsRunning(false);
        setActiveWorkflow(null);
      }, 5000);
    }
  };

  // SVG helpers
  const getAgentCenter = (agentName: string) => {
    const a = AGENT_MAP[agentName];
    if (!a) return { x: 50, y: 50 };
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
          { label: "Agents Online", value: status.agents_online, icon: Bot, color: "text-neon-cyan" },
          { label: "Active Now", value: status.active_now, icon: Loader2, color: "text-neon-green" },
          { label: "Total Tasks", value: status.total_tasks.toLocaleString(), icon: CheckCircle2, color: "text-neon-purple" },
          { label: "Connections", value: status.connections, icon: Network, color: "text-neon-amber" },
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
              {activeWorkflow && (
                <Badge className="ml-2 animate-pulse bg-primary/20 text-primary border-primary/30 uppercase">
                  {activeWorkflow.replace("_", " ")}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              {isRunning && (
                <span className="text-[10px] font-mono text-neon-cyan flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-neon-cyan animate-pulse" />
                  ORCHESTRATING
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full" style={{ paddingBottom: "55%" }}>
            <svg
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
              </defs>

              {/* Connection Lines */}
              {CONNECTIONS.map((conn, i) => {
                const from = getAgentCenter(conn.from);
                const to = getAgentCenter(conn.to);

                const fromAgent = agents.find(a => a.name === conn.from);
                const toAgent = agents.find(a => a.name === conn.to);
                const isActive = fromAgent?.status === "active" || toAgent?.status === "active";

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
                  </g>
                );
              })}

              {/* Agent Nodes */}
              {Object.entries(AGENT_MAP).map(([name, config]) => {
                const agent = agents.find(a => a.name === name);
                const isProcessing = agent?.status === "active";
                const isActive = agent?.status === "active";

                return (
                  <g key={name}>
                    {/* Pulse ring for active */}
                    {isProcessing && (
                      <circle
                        cx={config.x} cy={config.y} r={5}
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
                      cx={config.x} cy={config.y} r={4}
                      fill="hsl(var(--card))"
                      stroke={isProcessing ? "hsl(var(--primary))" : "hsl(var(--border))"}
                      strokeWidth={isProcessing ? 0.4 : 0.2}
                      style={{ transition: "all 0.3s ease" }}
                    />

                    {/* Icon placeholder */}
                    <circle
                      cx={config.x} cy={config.y}
                      r={1.5}
                      fill={isProcessing ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                      opacity={0.6}
                    />

                    {/* Label */}
                    <text
                      x={config.x} y={config.y + 7}
                      textAnchor="middle"
                      fill="hsl(var(--foreground))"
                      fontSize="2.2"
                      fontWeight="600"
                    >
                      {name}
                    </text>

                    {/* Status indicator */}
                    <circle
                      cx={config.x + 3} cy={config.y - 3}
                      r={0.8}
                      fill={isProcessing ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                    >
                      {isProcessing && (
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

      {/* Workflow Controls + Shared Memory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Scenario Buttons */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="h-4 w-4 text-neon-green" />
              Simulate Agent Flow
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {WORKFLOWS.map(workflow => (
              <Button
                key={workflow.id}
                variant="outline"
                className="w-full justify-between text-left h-auto py-3"
                disabled={isRunning}
                onClick={() => triggerWorkflow(workflow.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <workflow.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{workflow.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono uppercase">
                      Trigger Swarm Event
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Swarm Memory Viewer */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-4 w-4 text-neon-cyan" />
              Shared Swarm Memory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Schedule Updates", value: memory?.last_schedule_update || 0 },
                { label: "Generated Posts", value: memory?.generated_posts || 0 },
                { label: "Email Drafts", value: memory?.email_notifications || 0 },
                { label: "Participants", value: memory?.participants || 0 },
              ].map(item => (
                <div key={item.label} className="p-3 bg-muted/30 rounded-lg border border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">{item.label}</p>
                  <p className="text-lg font-mono font-bold text-primary">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-2 bg-black/20 rounded border border-white/5">
              <p className="text-[9px] font-mono text-neon-green/70 flex items-center gap-1">
                <span className="h-1 w-1 bg-neon-green rounded-full" />
                MEMORY STORE SYNCED
              </p>
            </div>
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
              <p className="text-sm text-muted-foreground text-center py-8">Waiting for swarm activity...</p>
            ) : (
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                {activityLog.map((log, i) => (
                  <div key={i} className="flex flex-col gap-0.5 pb-2 border-b border-border/30 last:border-0 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[8px] bg-primary/5 text-primary border-primary/20 px-1 py-0">{log.agent}</Badge>
                      <span className="text-[8px] font-mono text-muted-foreground">{log.time}</span>
                    </div>
                    <p className="text-[11px] text-foreground/90 leading-tight mt-0.5">{log.message}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agent Status Cards */}
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <Bot className="h-4 w-4" /> Agent Health & Status
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {agents.map((agent, i) => {
          const config = AGENT_MAP[agent.name];
          if (!config) return null;
          const Icon = config.icon;
          return (
            <div
              key={agent.name}
              className={`glass-card rounded-xl p-4 animate-fade-in transition-all duration-300 ${agent.status === "active" ? "ring-1 ring-primary/50 shadow-[0_0_15px_-5px_hsl(var(--primary))]" : ""
                }`}
              style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${config.bgColor}`}>
                    <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                  </div>
                  <span className="text-sm font-semibold">{agent.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant={agent.status === "active" ? "default" : "secondary"} className="text-[9px] uppercase px-1.5 py-0">
                    {agent.status}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                <span className="text-[10px] text-muted-foreground font-mono">{agent.tasks} tasks processed</span>
                {agent.status === "active" && (
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
