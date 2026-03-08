import { Users, CalendarClock, Mail, Share2, Clock, Zap, Bot, AlertTriangle, CheckCircle2, FileText, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const stats = [
  { label: "Total Participants", value: "2,847", change: "+156 today", icon: Users, color: "text-neon-cyan" },
  { label: "Sessions Scheduled", value: "48", change: "12 upcoming", icon: CalendarClock, color: "text-neon-green" },
  { label: "Emails Sent", value: "8,432", change: "94% open rate", icon: Mail, color: "text-neon-purple" },
  { label: "Social Posts Generated", value: "326", change: "+18 today", icon: Share2, color: "text-neon-amber" },
];

const upcomingSessions = [
  { time: "09:00 AM", title: "Opening Keynote — Dr. Sarah Chen", track: "Main Stage" },
  { time: "10:30 AM", title: "AI in Production Workshop", track: "Track A" },
  { time: "12:00 PM", title: "Lunch & Networking", track: "All Tracks" },
  { time: "01:30 PM", title: "Panel: Future of DevOps", track: "Main Stage" },
  { time: "03:00 PM", title: "Hackathon Kickoff", track: "Workshop Hall" },
];

const swarmFeed = [
  { time: "Just now", agent: "Content Generator", icon: FileText, color: "text-neon-cyan", msg: "Published LinkedIn post for TechSummit keynote announcement" },
  { time: "2 min ago", agent: "Disruption Handler", icon: AlertTriangle, color: "text-neon-amber", msg: "Detected speaker cancellation — auto-reassigning backup speaker" },
  { time: "5 min ago", agent: "Email Orchestrator", icon: Mail, color: "text-neon-purple", msg: "Sent 432 personalized reminder emails for tomorrow's sessions" },
  { time: "8 min ago", agent: "Schedule Optimizer", icon: CheckCircle2, color: "text-neon-green", msg: "Resolved 3 time-slot conflicts in Track B" },
  { time: "12 min ago", agent: "Engagement Analyst", icon: TrendingUp, color: "text-neon-cyan", msg: "Registration surge detected — Track A at 94% capacity" },
  { time: "18 min ago", agent: "Participant Manager", icon: Users, color: "text-neon-green", msg: "Synced 156 new registrations from external portal" },
  { time: "25 min ago", agent: "Social Media Agent", icon: Share2, color: "text-neon-amber", msg: "Generated 5 Twitter thread drafts for speaker highlights" },
  { time: "32 min ago", agent: "Content Generator", icon: FileText, color: "text-neon-cyan", msg: "Created event recap blog post template" },
];

const chartData = [
  { day: "Mon", registrations: 45, emails: 120 },
  { day: "Tue", registrations: 62, emails: 340 },
  { day: "Wed", registrations: 78, emails: 580 },
  { day: "Thu", registrations: 91, emails: 720 },
  { day: "Fri", registrations: 120, emails: 1100 },
  { day: "Sat", registrations: 156, emails: 1400 },
  { day: "Sun", registrations: 134, emails: 980 },
];

const Index = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
        <p className="text-sm text-muted-foreground mt-1">AI swarm managing your events in real-time</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
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
                    <stop offset="5%" stopColor="hsl(190, 95%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(190, 95%, 45%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="emailGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(270, 80%, 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(270, 80%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 18%, 16%)" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(215, 15%, 40%)" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(215, 15%, 40%)" />
                <Tooltip contentStyle={{ background: "hsl(225, 22%, 9%)", border: "1px solid hsl(225, 18%, 16%)", borderRadius: "8px", fontSize: "12px" }} />
                <Area type="monotone" dataKey="registrations" stroke="hsl(190, 95%, 45%)" fill="url(#regGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="emails" stroke="hsl(270, 80%, 60%)" fill="url(#emailGrad)" strokeWidth={2} />
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
          {swarmFeed.map((a, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors animate-fade-in"
              style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
            >
              <div className={`mt-0.5 ${a.color}`}>
                <a.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary">{a.agent}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{a.time}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{a.msg}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
