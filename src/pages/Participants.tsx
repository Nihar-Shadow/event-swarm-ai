import { Users } from "lucide-react";

const participants = [
  { name: "Emma Watson", email: "emma@techcorp.io", event: "TechSummit 2026", status: "Confirmed" },
  { name: "James Park", email: "james@devstudio.co", event: "TechSummit 2026", status: "Pending" },
  { name: "Aisha Patel", email: "aisha@datalab.ai", event: "HackWeek Spring", status: "Confirmed" },
  { name: "Carlos Mendez", email: "carlos@cloud9.dev", event: "TechSummit 2026", status: "Confirmed" },
  { name: "Yuki Tanaka", email: "yuki@nexgen.jp", event: "DevCon Asia", status: "Waitlisted" },
];

const Participants = () => (
  <div className="space-y-6 max-w-5xl mx-auto">
    <div className="animate-fade-in">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Participants</h1>
      </div>
      <p className="text-sm text-muted-foreground mt-1">Manage attendee registrations</p>
    </div>
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Email</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Event</th>
              <th className="text-left p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p, i) => (
              <tr key={i} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                <td className="p-4 font-medium">{p.name}</td>
                <td className="p-4 text-muted-foreground font-mono text-xs hidden sm:table-cell">{p.email}</td>
                <td className="p-4 text-muted-foreground text-xs">{p.event}</td>
                <td className="p-4">
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                    p.status === "Confirmed" ? "bg-neon-green/10 text-neon-green" :
                    p.status === "Pending" ? "bg-neon-amber/10 text-neon-amber" :
                    "bg-muted text-muted-foreground"
                  }`}>{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

export default Participants;
