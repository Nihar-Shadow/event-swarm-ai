import { Users, Search, Filter } from "lucide-react";

const participants = [
  { name: "Emma Watson", email: "emma@techcorp.io", event: "TechSummit 2026", ticket: "VIP", status: "Confirmed", registered: "Mar 1" },
  { name: "James Park", email: "james@devstudio.co", event: "TechSummit 2026", ticket: "Standard", status: "Pending", registered: "Mar 2" },
  { name: "Aisha Patel", email: "aisha@datalab.ai", event: "HackWeek Spring", ticket: "Speaker", status: "Confirmed", registered: "Feb 28" },
  { name: "Carlos Mendez", email: "carlos@cloud9.dev", event: "TechSummit 2026", ticket: "Standard", status: "Confirmed", registered: "Mar 3" },
  { name: "Yuki Tanaka", email: "yuki@nexgen.jp", event: "DevCon Asia", ticket: "VIP", status: "Waitlisted", registered: "Mar 4" },
  { name: "Lina Nakamura", email: "lina@infraco.com", event: "TechSummit 2026", ticket: "Standard", status: "Confirmed", registered: "Mar 1" },
  { name: "Marcus Rivera", email: "marcus@aiforge.dev", event: "TechSummit 2026", ticket: "Speaker", status: "Confirmed", registered: "Feb 25" },
  { name: "Sophie Chen", email: "sophie@byteworks.co", event: "HackWeek Spring", ticket: "Standard", status: "Pending", registered: "Mar 5" },
];

const statusStyle = (s: string) =>
  s === "Confirmed" ? "bg-neon-green/10 text-neon-green" :
  s === "Pending" ? "bg-neon-amber/10 text-neon-amber" :
  "bg-muted text-muted-foreground";

const ticketStyle = (t: string) =>
  t === "VIP" ? "bg-neon-purple/10 text-neon-purple" :
  t === "Speaker" ? "bg-neon-cyan/10 text-neon-cyan" :
  "bg-secondary text-muted-foreground";

const Participants = () => (
  <div className="space-y-6 max-w-7xl mx-auto">
    <div className="animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Participants</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">2,847 registered across all events</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="glass-card rounded-lg flex items-center gap-2 px-3 py-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Search participants...</span>
        </div>
        <div className="glass-card rounded-lg flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-secondary/80 transition-colors">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Filter</span>
        </div>
      </div>
    </div>

    <div className="glass-card rounded-xl overflow-hidden animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Email</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Event</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Ticket</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Registered</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p, i) => (
              <tr key={i} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                <td className="p-4 font-medium">{p.name}</td>
                <td className="p-4 text-muted-foreground font-mono text-xs hidden md:table-cell">{p.email}</td>
                <td className="p-4 text-muted-foreground text-xs hidden lg:table-cell">{p.event}</td>
                <td className="p-4"><span className={`text-xs font-mono px-2 py-0.5 rounded-full ${ticketStyle(p.ticket)}`}>{p.ticket}</span></td>
                <td className="p-4"><span className={`text-xs font-mono px-2 py-0.5 rounded-full ${statusStyle(p.status)}`}>{p.status}</span></td>
                <td className="p-4 text-xs text-muted-foreground font-mono hidden sm:table-cell">{p.registered}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default Participants;
