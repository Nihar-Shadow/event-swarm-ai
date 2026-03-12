import { Users, CalendarClock, Mail, Share2, Clock, Zap, Bot, AlertTriangle, CheckCircle2, FileText, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Static stats removed - now dynamic

// Hardcoded upcoming sessions removed - now dynamic

// We will fetch swarm feed from backend
interface ActivityFeedItem {
  agent: string;
  message: string;
  time: string;
  timestamp?: string;
}

const getAgentInfo = (agent: string) => {
  if (agent.includes("Schedule")) return { icon: CalendarClock, color: "text-neon-green" };
  if (agent.includes("Reasoning")) return { icon: Bot, color: "text-neon-cyan" };
  if (agent.includes("Email")) return { icon: Mail, color: "text-neon-purple" };
  if (agent.includes("Social")) return { icon: Share2, color: "text-neon-amber" };
  return { icon: Bot, color: "text-primary" };
};

const chartData = [
  { day: "Mon", registrations: 45, emails: 120 },
  { day: "Tue", registrations: 62, emails: 340 },
  { day: "Wed", registrations: 78, emails: 580 },
  { day: "Thu", registrations: 91, emails: 720 },
  { day: "Fri", registrations: 120, emails: 1100 },
  { day: "Sat", registrations: 156, emails: 1400 },
  { day: "Sun", registrations: 134, emails: 980 },
];

import { useState, useEffect } from "react";

const Index = () => {
  const [feed, setFeed] = useState<ActivityFeedItem[]>([]);
  const [memory, setMemory] = useState({
    participants: 0,
    sessions: 0,
    emails: 0,
    posts: 0
  });

  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);

  const fetchInitialData = async () => {
    try {
      const [activityRes, memoryRes, scheduleRes] = await Promise.all([
        fetch("http://localhost:8000/api/swarm/activity"),
        fetch("http://localhost:8000/api/swarm/memory"),
        fetch("http://localhost:8000/api/swarm/memory") // Using memory endpoint to get schedule details
      ]);

      if (activityRes.ok) setFeed(await activityRes.json());
      if (memoryRes.ok) {
        const memData = await memoryRes.json();
        setMemory({
          participants: memData.participants,
          sessions: memData.last_schedule_update,
          emails: memData.email_notifications,
          posts: memData.generated_posts
        });
      }

      // Fetch full memory to get schedule details for Upcoming Sessions
      const fullMemRes = await fetch("http://localhost:8000/api/swarm-memory");
      if (fullMemRes.ok) {
        const fullMem = await fullMemRes.json();
        const schedule = fullMem.last_schedule_update || [];
        if (schedule.length > 0) {
          setUpcomingSessions(schedule.map((s: any) => ({
            time: s.scheduled_start,
            title: s.session,
            track: s.room_id
          })).slice(0, 5));
        } else {
          setUpcomingSessions([
            { time: "09:00 AM", title: "Wait for Swarm...", track: "System Idle" }
          ]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch initial swarm data", err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8000/ws/swarm");

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // Update Feed
      setFeed(prev => [{
        agent: data.agent,
        message: data.message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        timestamp: data.timestamp
      }, ...prev].slice(0, 50));

      // 3. Update Memory Counters if present
      if (data.memory_update) {
        setMemory(prev => ({
          participants: data.memory_update.participants ?? prev.participants,
          sessions: data.memory_update.last_schedule_update ?? prev.sessions,
          emails: data.memory_update.email_notifications ?? prev.emails,
          posts: data.memory_update.generated_posts ?? prev.posts
        }));
      }

      // 4. Update Upcoming Sessions on schedule change
      if (data.event === "schedule_updated") {
        fetchInitialData(); // Re-fetch all to get full schedule details
      }
    };

    return () => socket.close();
  }, []);

  const dynamicStats = [
    { label: "Total Participants", value: memory.participants.toLocaleString(), change: "+0 today", icon: Users, color: "text-neon-cyan" },
    { label: "Sessions Scheduled", value: memory.sessions.toString(), change: "Live sync", icon: CalendarClock, color: "text-neon-green" },
    { label: "Emails Prepared", value: memory.emails.toLocaleString(), change: "Drafts ready", icon: Mail, color: "text-neon-purple" },
    { label: "Social Posts", value: memory.posts.toString(), change: "Generated", icon: Share2, color: "text-neon-amber" },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
        <p className="text-sm text-muted-foreground mt-1">AI swarm managing your events in real-time</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {dynamicStats.map((stat, i) => (
          <div
            key={stat.label}
            className="glass-card rounded-xl p-5 animate-fade-in"
            style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold mt-1 font-mono">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </div>
              <div className={`${stat.color} p-2 rounded-lg bg-secondary`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + Upcoming Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Weekly Activity</h3>
            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-neon-cyan" />
                <span className="text-[10px] text-muted-foreground">Registrations</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-neon-purple" />
                <span className="text-[10px] text-muted-foreground">Emails</span>
              </div>
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(215, 90%, 50%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(215, 90%, 50%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="emailGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(250, 65%, 55%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(250, 65%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(220, 8%, 65%)" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 8%, 65%)" />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid hsl(220, 13%, 91%)", borderRadius: "8px", fontSize: "12px" }} />
                <Area type="monotone" dataKey="registrations" stroke="hsl(215, 90%, 50%)" fill="url(#regGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="emails" stroke="hsl(250, 65%, 55%)" fill="url(#emailGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Upcoming Sessions</h3>
          </div>
          <div className="space-y-2">
            {upcomingSessions.map((s, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 animate-fade-in"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
              >
                <span className="text-xs font-mono text-primary mt-0.5 w-16 shrink-0">{s.time}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.title}</p>
                  <p className="text-[10px] text-muted-foreground">{s.track}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Swarm Activity Feed */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Swarm Activity Feed</h3>
          <div className="ml-auto flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-neon-green animate-pulse-slow" />
            <span className="text-xs text-muted-foreground font-mono">LIVE</span>
          </div>
        </div>
        <div className="space-y-1">
          {feed.length === 0 ? (
            <p className="text-sm text-muted-foreground p-3">No swarm activity yet...</p>
          ) : (
            feed.map((a, i) => {
              const info = getAgentInfo(a.agent);
              const Icon = info.icon;
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
                >
                  <div className={`mt-0.5 ${info.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-primary">{a.agent}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{a.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{a.message}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
