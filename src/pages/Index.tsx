import { StatsCards } from "@/components/dashboard/StatsCards";
import { AgentStatus } from "@/components/dashboard/AgentStatus";
import { ActivityLog } from "@/components/dashboard/ActivityLog";
import { EngagementChart } from "@/components/dashboard/EngagementChart";

const Index = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
        <p className="text-sm text-muted-foreground mt-1">AI swarm managing your events in real-time</p>
      </div>

      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EngagementChart />
        <AgentStatus />
      </div>

      <ActivityLog />
    </div>
  );
};

export default Index;
