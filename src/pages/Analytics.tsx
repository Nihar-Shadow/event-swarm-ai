import { BarChart3, TrendingUp, Users, Mail, Share2, CalendarClock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const registrationData = [
  { week: "W1", count: 245 },
  { week: "W2", count: 398 },
  { week: "W3", count: 512 },
  { week: "W4", count: 687 },
  { week: "W5", count: 834 },
  { week: "W6", count: 1005 },
];

const channelData = [
  { name: "Email", value: 42, color: "hsl(270, 80%, 60%)" },
  { name: "Social", value: 28, color: "hsl(190, 95%, 45%)" },
  { name: "Organic", value: 18, color: "hsl(145, 80%, 42%)" },
  { name: "Referral", value: 12, color: "hsl(38, 95%, 55%)" },
];

const engagementData = [
  { day: "Mon", opens: 72, clicks: 34 },
  { day: "Tue", opens: 68, clicks: 41 },
  { day: "Wed", opens: 85, clicks: 52 },
  { day: "Thu", opens: 92, clicks: 61 },
  { day: "Fri", opens: 88, clicks: 55 },
  { day: "Sat", opens: 95, clicks: 68 },
  { day: "Sun", opens: 79, clicks: 43 },
];

const Analytics = () => (
  <div className="space-y-6 max-w-7xl mx-auto">
    <div className="animate-fade-in">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
      </div>
      <p className="text-sm text-muted-foreground mt-1">Event performance insights powered by AI analysis</p>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: "Conversion Rate", value: "34.2%", icon: TrendingUp, color: "text-neon-cyan" },
        { label: "Avg. Session Rating", value: "4.7/5", icon: CalendarClock, color: "text-neon-green" },
        { label: "Email ROI", value: "312%", icon: Mail, color: "text-neon-purple" },
        { label: "Social Reach", value: "284K", icon: Share2, color: "text-neon-amber" },
      ].map((s, i) => (
        <div key={s.label} className="glass-card rounded-xl p-4 animate-fade-in" style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
          <div className={`${s.color} mb-2`}><s.icon className="h-4 w-4" /></div>
          <p className="text-xl font-bold font-mono">{s.value}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Registration trend */}
      <div className="glass-card rounded-xl p-5 animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" /> Registration Trend
        </h3>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={registrationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 18%, 16%)" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(215, 15%, 40%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(215, 15%, 40%)" />
              <Tooltip contentStyle={{ background: "hsl(225, 22%, 9%)", border: "1px solid hsl(225, 18%, 16%)", borderRadius: "8px", fontSize: "12px" }} />
              <Bar dataKey="count" fill="hsl(190, 95%, 45%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Channel breakdown */}
      <div className="glass-card rounded-xl p-5 animate-fade-in" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
        <h3 className="text-sm font-semibold mb-4">Traffic Channels</h3>
        <div className="h-[240px] flex items-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={channelData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" stroke="none">
                {channelData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(225, 22%, 9%)", border: "1px solid hsl(225, 18%, 16%)", borderRadius: "8px", fontSize: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 pr-4">
            {channelData.map((c) => (
              <div key={c.name} className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                <span className="text-xs text-muted-foreground whitespace-nowrap">{c.name} ({c.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Engagement chart */}
      <div className="glass-card rounded-xl p-5 lg:col-span-2 animate-fade-in" style={{ animationDelay: "400ms", animationFillMode: "both" }}>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" /> Email Engagement
          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-neon-cyan" /><span className="text-[10px] text-muted-foreground">Opens %</span></div>
            <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-neon-purple" /><span className="text-[10px] text-muted-foreground">Clicks %</span></div>
          </div>
        </h3>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 18%, 16%)" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(215, 15%, 40%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(215, 15%, 40%)" />
              <Tooltip contentStyle={{ background: "hsl(225, 22%, 9%)", border: "1px solid hsl(225, 18%, 16%)", borderRadius: "8px", fontSize: "12px" }} />
              <Line type="monotone" dataKey="opens" stroke="hsl(190, 95%, 45%)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="clicks" stroke="hsl(270, 80%, 60%)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  </div>
);

export default Analytics;
