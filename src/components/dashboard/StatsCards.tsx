import { Users, Calendar, Mail, Bot } from "lucide-react";

const stats = [
  { label: "Active Events", value: "12", change: "+3 this week", icon: Calendar, color: "text-neon-cyan" },
  { label: "Participants", value: "2,847", change: "+156 today", icon: Users, color: "text-neon-green" },
  { label: "Emails Sent", value: "8,432", change: "94% delivered", icon: Mail, color: "text-neon-purple" },
  { label: "AI Tasks Done", value: "1,293", change: "23 in queue", icon: Bot, color: "text-neon-amber" },
];

export function StatsCards() {
  return (
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
  );
}
