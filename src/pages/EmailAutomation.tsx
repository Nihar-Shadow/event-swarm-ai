import { Mail, Send, Clock, CheckCircle2, AlertTriangle, BarChart3 } from "lucide-react";

const campaigns = [
  { name: "TechSummit Early Bird Reminder", sent: 1240, opened: 1085, clicked: 672, status: "Completed", date: "Mar 5" },
  { name: "Speaker Lineup Announcement", sent: 2100, opened: 1890, clicked: 1456, status: "Completed", date: "Mar 4" },
  { name: "Workshop Registration Nudge", sent: 850, opened: 0, clicked: 0, status: "Scheduled", date: "Mar 9" },
  { name: "Last Chance — VIP Upgrade", sent: 0, opened: 0, clicked: 0, status: "Draft", date: "—" },
];

const recentEmails = [
  { time: "3 min ago", subject: "Your TechSummit schedule is ready", recipients: 432, status: "sent" },
  { time: "15 min ago", subject: "Speaker spotlight: Dr. Sarah Chen", recipients: 2100, status: "sent" },
  { time: "1 hr ago", subject: "Track B session update", recipients: 380, status: "sent" },
  { time: "2 hr ago", subject: "Welcome to TechSummit 2026!", recipients: 156, status: "sent" },
];

const statusStyle = (s: string) =>
  s === "Completed" ? "bg-neon-green/10 text-neon-green" :
  s === "Scheduled" ? "bg-neon-cyan/10 text-neon-cyan" :
  "bg-muted text-muted-foreground";

const EmailAutomation = () => (
  <div className="space-y-6 max-w-7xl mx-auto">
    <div className="animate-fade-in">
      <div className="flex items-center gap-2">
        <Mail className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Email Automation</h1>
      </div>
      <p className="text-sm text-muted-foreground mt-1">AI-powered email campaigns managed by the Email Orchestrator agent</p>
    </div>

    {/* Quick stats */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: "Total Sent", value: "8,432", icon: Send, color: "text-neon-cyan" },
        { label: "Open Rate", value: "89.4%", icon: Mail, color: "text-neon-green" },
        { label: "Click Rate", value: "52.1%", icon: BarChart3, color: "text-neon-purple" },
        { label: "Scheduled", value: "3", icon: Clock, color: "text-neon-amber" },
      ].map((s, i) => (
        <div key={s.label} className="glass-card rounded-xl p-4 animate-fade-in" style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
          <div className={`${s.color} mb-2`}><s.icon className="h-4 w-4" /></div>
          <p className="text-xl font-bold font-mono">{s.value}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
        </div>
      ))}
    </div>

    {/* Campaigns table */}
    <div className="glass-card rounded-xl p-5 animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
      <h3 className="text-sm font-semibold mb-4">Campaigns</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Campaign</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Sent</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Opened</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Clicked</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c, i) => (
              <tr key={i} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 text-muted-foreground font-mono text-xs hidden sm:table-cell">{c.sent.toLocaleString()}</td>
                <td className="p-3 text-muted-foreground font-mono text-xs hidden md:table-cell">{c.opened.toLocaleString()}</td>
                <td className="p-3 text-muted-foreground font-mono text-xs hidden md:table-cell">{c.clicked.toLocaleString()}</td>
                <td className="p-3"><span className={`text-xs font-mono px-2 py-0.5 rounded-full ${statusStyle(c.status)}`}>{c.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* Recent automated emails */}
    <div className="glass-card rounded-xl p-5 animate-fade-in" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
      <div className="flex items-center gap-2 mb-4">
        <Send className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Recent AI-Sent Emails</h3>
      </div>
      <div className="space-y-2">
        {recentEmails.map((e, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
            <CheckCircle2 className="h-3.5 w-3.5 text-neon-green shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{e.subject}</p>
              <p className="text-[10px] text-muted-foreground">{e.recipients} recipients</p>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">{e.time}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default EmailAutomation;
