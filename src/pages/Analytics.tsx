import { useState, useEffect } from "react";
import {
  BarChart3, TrendingUp, Users, Mail, Share2, CalendarClock,
  Sparkles, Clock, Eye, Heart, MessageCircle, Linkedin, Twitter, Instagram,
  ArrowUp, ArrowDown, Zap, Target
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadarChart,
  PolarGrid, PolarAngleAxis, Radar, Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

// ── Chart tooltip style ──
const tooltipStyle = {
  background: "hsl(225, 22%, 9%)",
  border: "1px solid hsl(225, 18%, 16%)",
  borderRadius: "8px",
  fontSize: "12px",
};

// ── Static + computed data ──
const registrationData = [
  { week: "W1", count: 245, cumulative: 245 },
  { week: "W2", count: 398, cumulative: 643 },
  { week: "W3", count: 512, cumulative: 1155 },
  { week: "W4", count: 687, cumulative: 1842 },
  { week: "W5", count: 834, cumulative: 2676 },
  { week: "W6", count: 1005, cumulative: 3681 },
  { week: "W7 (proj)", count: 1180, cumulative: 4861 },
  { week: "W8 (proj)", count: 1340, cumulative: 6201 },
];

const channelData = [
  { name: "Email", value: 42, color: "hsl(270, 80%, 60%)" },
  { name: "Social", value: 28, color: "hsl(190, 95%, 45%)" },
  { name: "Organic", value: 18, color: "hsl(145, 80%, 42%)" },
  { name: "Referral", value: 12, color: "hsl(38, 95%, 55%)" },
];

const emailEngagement = [
  { day: "Mon", opens: 72, clicks: 34, bounces: 3 },
  { day: "Tue", opens: 68, clicks: 41, bounces: 2 },
  { day: "Wed", opens: 85, clicks: 52, bounces: 1 },
  { day: "Thu", opens: 92, clicks: 61, bounces: 4 },
  { day: "Fri", opens: 88, clicks: 55, bounces: 2 },
  { day: "Sat", opens: 95, clicks: 68, bounces: 1 },
  { day: "Sun", opens: 79, clicks: 43, bounces: 3 },
];

const socialEngagementByHour = [
  { hour: "6AM", instagram: 12, linkedin: 8, twitter: 15 },
  { hour: "8AM", instagram: 25, linkedin: 45, twitter: 38 },
  { hour: "10AM", instagram: 40, linkedin: 62, twitter: 52 },
  { hour: "12PM", instagram: 55, linkedin: 48, twitter: 60 },
  { hour: "2PM", instagram: 48, linkedin: 55, twitter: 45 },
  { hour: "4PM", instagram: 62, linkedin: 40, twitter: 50 },
  { hour: "6PM", instagram: 78, linkedin: 35, twitter: 58 },
  { hour: "8PM", instagram: 85, linkedin: 72, twitter: 65 },
  { hour: "10PM", instagram: 70, linkedin: 28, twitter: 42 },
];

const socialPlatformStats = [
  { platform: "Instagram", icon: Instagram, color: "text-neon-rose", engagement: 85, followers: "12.4K", bestTime: "8 PM", predictedReach: "18.7K", growth: "+12%" },
  { platform: "LinkedIn", icon: Linkedin, color: "text-neon-purple", engagement: 72, followers: "8.9K", bestTime: "8 PM", predictedReach: "34.2K", growth: "+18%" },
  { platform: "Twitter", icon: Twitter, color: "text-neon-cyan", engagement: 65, followers: "15.1K", bestTime: "12 PM", predictedReach: "12.4K", growth: "+8%" },
];

const radarData = [
  { metric: "Open Rate", value: 65, benchmark: 45 },
  { metric: "Click Rate", value: 42, benchmark: 25 },
  { metric: "Conversion", value: 34, benchmark: 20 },
  { metric: "Engagement", value: 78, benchmark: 50 },
  { metric: "Deliverability", value: 96, benchmark: 85 },
  { metric: "Response Rate", value: 55, benchmark: 30 },
];

const emailCampaignPerformance = [
  { campaign: "Early Bird", sent: 500, opened: 342, clicked: 156, converted: 89 },
  { campaign: "Speaker Reveal", sent: 800, opened: 624, clicked: 312, converted: 145 },
  { campaign: "Workshop Invite", sent: 650, opened: 455, clicked: 227, converted: 98 },
  { campaign: "Final Reminder", sent: 1200, opened: 960, clicked: 576, converted: 312 },
];

const aiPredictions = [
  { label: "LinkedIn engagement predicted to peak at 8 PM", confidence: 92, icon: Linkedin, color: "text-neon-purple" },
  { label: "Email open rate predicted to be 65%", confidence: 88, icon: Mail, color: "text-neon-cyan" },
  { label: "Instagram story views will peak on Thursday", confidence: 85, icon: Instagram, color: "text-neon-rose" },
  { label: "Registration surge expected in Week 7", confidence: 79, icon: TrendingUp, color: "text-neon-green" },
  { label: "Twitter engagement optimal with 2-3 hashtags", confidence: 91, icon: Twitter, color: "text-neon-cyan" },
  { label: "Best email send time: Tuesday 10:30 AM", confidence: 87, icon: Clock, color: "text-neon-amber" },
];

const Analytics = () => {
  const [participantCount, setParticipantCount] = useState(0);
  const [emailCampaignCount, setEmailCampaignCount] = useState(0);
  const [totalEmails, setTotalEmails] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      const [pRes, cRes, eRes] = await Promise.all([
        supabase.from("participants").select("id", { count: "exact", head: true }),
        supabase.from("email_campaigns").select("id", { count: "exact", head: true }),
        supabase.from("email_logs").select("id", { count: "exact", head: true }),
      ]);
      setParticipantCount(pRes.count || 0);
      setEmailCampaignCount(cRes.count || 0);
      setTotalEmails(eRes.count || 0);
    };
    fetchCounts();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">AI-powered event performance insights & predictions</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Participants", value: participantCount || "3,681", icon: Users, color: "text-neon-cyan", trend: "+22%", up: true },
          { label: "Email Campaigns", value: emailCampaignCount || 4, icon: Mail, color: "text-neon-purple", trend: "65% open", up: true },
          { label: "Social Reach", value: "284K", icon: Share2, color: "text-neon-rose", trend: "+18%", up: true },
          { label: "Predicted Conv.", value: "34.2%", icon: Target, color: "text-neon-green", trend: "+5.1%", up: true },
        ].map((s, i) => (
          <div key={s.label} className="glass-card rounded-xl p-4 animate-fade-in" style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
            <div className="flex items-center justify-between mb-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className={`text-[10px] font-mono flex items-center gap-0.5 ${s.up ? "text-neon-green" : "text-destructive"}`}>
                {s.up ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
                {s.trend}
              </span>
            </div>
            <p className="text-xl font-bold font-mono">{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="email">Email Analytics</TabsTrigger>
          <TabsTrigger value="social">Social Predictions</TabsTrigger>
          <TabsTrigger value="predictions">
            <Sparkles className="h-3 w-3 mr-1" />AI Insights
          </TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Registration Trend */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />Registration Trend
                  <Badge variant="secondary" className="text-[9px] ml-auto">+projected</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={registrationData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 18%, 16%)" />
                      <XAxis dataKey="week" tick={{ fontSize: 10 }} stroke="hsl(215, 15%, 40%)" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(215, 15%, 40%)" />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area type="monotone" dataKey="cumulative" fill="hsl(190, 95%, 45%)" fillOpacity={0.15} stroke="hsl(190, 95%, 45%)" strokeWidth={2} />
                      <Area type="monotone" dataKey="count" fill="hsl(270, 80%, 60%)" fillOpacity={0.1} stroke="hsl(270, 80%, 60%)" strokeWidth={1.5} strokeDasharray="4 2" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Channel Breakdown */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Traffic Channels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[240px] flex items-center">
                  <ResponsiveContainer width="60%" height="100%">
                    <PieChart>
                      <Pie data={channelData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" stroke="none">
                        {channelData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3">
                    {channelData.map(c => (
                      <div key={c.name} className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                        <div>
                          <p className="text-xs font-medium">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{c.value}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Performance Radar */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-neon-amber" />Performance vs Benchmark
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(225, 18%, 16%)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "hsl(215, 15%, 55%)" }} />
                      <Radar name="Your Event" dataKey="value" stroke="hsl(190, 95%, 45%)" fill="hsl(190, 95%, 45%)" fillOpacity={0.2} strokeWidth={2} />
                      <Radar name="Industry Avg" dataKey="benchmark" stroke="hsl(225, 18%, 40%)" fill="hsl(225, 18%, 40%)" fillOpacity={0.1} strokeWidth={1} strokeDasharray="4 4" />
                      <Legend wrapperStyle={{ fontSize: "10px" }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Funnel */}
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4 text-neon-purple" />Campaign Funnel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={emailCampaignPerformance} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 18%, 16%)" />
                      <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(215, 15%, 40%)" />
                      <YAxis dataKey="campaign" type="category" tick={{ fontSize: 10 }} stroke="hsl(215, 15%, 40%)" width={90} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="sent" fill="hsl(225, 18%, 30%)" radius={[0, 2, 2, 0]} name="Sent" />
                      <Bar dataKey="opened" fill="hsl(190, 95%, 45%)" radius={[0, 2, 2, 0]} name="Opened" />
                      <Bar dataKey="clicked" fill="hsl(270, 80%, 60%)" radius={[0, 2, 2, 0]} name="Clicked" />
                      <Bar dataKey="converted" fill="hsl(145, 80%, 42%)" radius={[0, 2, 2, 0]} name="Converted" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Email Analytics ── */}
        <TabsContent value="email" className="space-y-4">
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />Email Engagement by Day
                <div className="ml-auto flex items-center gap-4">
                  <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-neon-cyan" /><span className="text-[10px] text-muted-foreground">Opens %</span></div>
                  <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-neon-purple" /><span className="text-[10px] text-muted-foreground">Clicks %</span></div>
                  <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-destructive" /><span className="text-[10px] text-muted-foreground">Bounces %</span></div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={emailEngagement}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 18%, 16%)" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(215, 15%, 40%)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(215, 15%, 40%)" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="opens" stroke="hsl(190, 95%, 45%)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(190, 95%, 45%)" }} />
                    <Line type="monotone" dataKey="clicks" stroke="hsl(270, 80%, 60%)" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="bounces" stroke="hsl(0, 72%, 51%)" strokeWidth={1.5} dot={{ r: 3 }} strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Performance Table */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Campaign Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Campaign</th>
                      <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Sent</th>
                      <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Open Rate</th>
                      <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Click Rate</th>
                      <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Conv. Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailCampaignPerformance.map(c => (
                      <tr key={c.campaign} className="border-b border-border/50">
                        <td className="py-2.5 px-3 font-medium">{c.campaign}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-muted-foreground">{c.sent}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-neon-cyan">{((c.opened / c.sent) * 100).toFixed(1)}%</td>
                        <td className="py-2.5 px-3 text-right font-mono text-neon-purple">{((c.clicked / c.sent) * 100).toFixed(1)}%</td>
                        <td className="py-2.5 px-3 text-right font-mono text-neon-green">{((c.converted / c.sent) * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Social Predictions ── */}
        <TabsContent value="social" className="space-y-4">
          {/* Engagement by Hour */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Share2 className="h-4 w-4 text-neon-rose" />Engagement by Time of Day
                <Badge variant="secondary" className="text-[9px] ml-auto">AI Predicted</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={socialEngagementByHour}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 18%, 16%)" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} stroke="hsl(215, 15%, 40%)" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(215, 15%, 40%)" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="instagram" fill="hsl(350, 85%, 60%)" fillOpacity={0.1} stroke="hsl(350, 85%, 60%)" strokeWidth={2} name="Instagram" />
                    <Area type="monotone" dataKey="linkedin" fill="hsl(270, 80%, 60%)" fillOpacity={0.1} stroke="hsl(270, 80%, 60%)" strokeWidth={2} name="LinkedIn" />
                    <Area type="monotone" dataKey="twitter" fill="hsl(190, 95%, 45%)" fillOpacity={0.1} stroke="hsl(190, 95%, 45%)" strokeWidth={2} name="Twitter" />
                    <Legend wrapperStyle={{ fontSize: "10px" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Platform Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {socialPlatformStats.map((p, i) => {
              const Icon = p.icon;
              return (
                <Card key={p.platform} className="glass-card animate-fade-in" style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${p.color}`} />
                        <span className="text-sm font-semibold">{p.platform}</span>
                      </div>
                      <span className="text-[10px] font-mono text-neon-green">{p.growth}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Followers</p>
                        <p className="text-sm font-bold font-mono">{p.followers}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Pred. Reach</p>
                        <p className="text-sm font-bold font-mono">{p.predictedReach}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Best Time</p>
                        <p className="text-sm font-bold font-mono flex items-center gap-1"><Clock className="h-3 w-3 text-neon-amber" />{p.bestTime}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Engagement</p>
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-1.5 rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${p.engagement}%` }} />
                          </div>
                          <span className="text-[10px] font-mono">{p.engagement}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ── AI Insights ── */}
        <TabsContent value="predictions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiPredictions.map((pred, i) => {
              const Icon = pred.icon;
              return (
                <Card key={i} className="glass-card animate-fade-in" style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-secondary shrink-0">
                        <Icon className={`h-4 w-4 ${pred.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-snug">{pred.label}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-1.5 rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-1000"
                              style={{ width: `${pred.confidence}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">{pred.confidence}% confidence</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recommended Schedule */}
          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-neon-green" />
                AI Recommended Posting Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Day</th>
                      <th className="text-center py-2 px-3 font-semibold text-muted-foreground">Instagram</th>
                      <th className="text-center py-2 px-3 font-semibold text-muted-foreground">LinkedIn</th>
                      <th className="text-center py-2 px-3 font-semibold text-muted-foreground">Twitter</th>
                      <th className="text-center py-2 px-3 font-semibold text-muted-foreground">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { day: "Monday", ig: "6:00 PM", li: "8:00 AM", tw: "12:00 PM", priority: "Medium" },
                      { day: "Tuesday", ig: "7:00 PM", li: "10:00 AM", tw: "9:00 AM", priority: "High" },
                      { day: "Wednesday", ig: "8:00 PM", li: "8:00 AM", tw: "12:00 PM", priority: "High" },
                      { day: "Thursday", ig: "6:00 PM", li: "10:00 AM", tw: "3:00 PM", priority: "Critical" },
                      { day: "Friday", ig: "5:00 PM", li: "9:00 AM", tw: "11:00 AM", priority: "Medium" },
                      { day: "Saturday", ig: "11:00 AM", li: "—", tw: "10:00 AM", priority: "Low" },
                      { day: "Sunday", ig: "10:00 AM", li: "—", tw: "4:00 PM", priority: "Low" },
                    ].map(row => (
                      <tr key={row.day} className="border-b border-border/50">
                        <td className="py-2.5 px-3 font-medium">{row.day}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-neon-rose">{row.ig}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-neon-purple">{row.li}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-neon-cyan">{row.tw}</td>
                        <td className="py-2.5 px-3 text-center">
                          <Badge variant={row.priority === "Critical" ? "destructive" : "secondary"} className="text-[9px]">
                            {row.priority}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
