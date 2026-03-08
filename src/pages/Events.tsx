import { Calendar, MapPin, Users } from "lucide-react";

const events = [
  { name: "TechSummit 2026", date: "Mar 15-17", location: "San Francisco", attendees: 1200, status: "Active" },
  { name: "HackWeek Spring", date: "Apr 5-7", location: "Austin", attendees: 350, status: "Planning" },
  { name: "DevCon Asia", date: "May 20-22", location: "Singapore", attendees: 800, status: "Planning" },
  { name: "AI & ML Conference", date: "Jun 10-12", location: "London", attendees: 600, status: "Draft" },
];

const Events = () => (
  <div className="space-y-6 max-w-5xl mx-auto">
    <div className="animate-fade-in">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Events</h1>
      </div>
      <p className="text-sm text-muted-foreground mt-1">Manage your upcoming events</p>
    </div>
    <div className="grid gap-4">
      {events.map((e, i) => (
        <div key={e.name} className="glass-card rounded-xl p-5 animate-fade-in" style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div>
              <h3 className="font-semibold">{e.name}</h3>
              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{e.date}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{e.location}</span>
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{e.attendees}</span>
              </div>
            </div>
            <span className={`text-xs font-mono px-3 py-1 rounded-full ${e.status === "Active" ? "bg-neon-green/10 text-neon-green" : e.status === "Planning" ? "bg-neon-cyan/10 text-neon-cyan" : "bg-muted text-muted-foreground"}`}>
              {e.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default Events;
