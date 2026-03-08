import { BarChart3 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { day: "Mon", registrations: 45, engagement: 72 },
  { day: "Tue", registrations: 62, engagement: 68 },
  { day: "Wed", registrations: 78, engagement: 85 },
  { day: "Thu", registrations: 91, engagement: 92 },
  { day: "Fri", registrations: 120, engagement: 88 },
  { day: "Sat", registrations: 156, engagement: 95 },
  { day: "Sun", registrations: 134, engagement: 79 },
];

export function EngagementChart() {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Weekly Overview</h3>
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-neon-cyan" />
            <span className="text-[10px] text-muted-foreground">Registrations</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-neon-purple" />
            <span className="text-[10px] text-muted-foreground">Engagement</span>
          </div>
        </div>
      </div>
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(190, 95%, 45%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(190, 95%, 45%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(270, 80%, 60%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(270, 80%, 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(225, 18%, 16%)" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(215, 15%, 40%)" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(215, 15%, 40%)" />
            <Tooltip
              contentStyle={{
                background: "hsl(225, 22%, 9%)",
                border: "1px solid hsl(225, 18%, 16%)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />
            <Area type="monotone" dataKey="registrations" stroke="hsl(190, 95%, 45%)" fill="url(#regGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="engagement" stroke="hsl(270, 80%, 60%)" fill="url(#engGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
