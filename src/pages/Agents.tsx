import { Bot } from "lucide-react";
import { AgentStatus } from "@/components/dashboard/AgentStatus";

const Agents = () => (
  <div className="space-y-6 max-w-5xl mx-auto">
    <div className="animate-fade-in">
      <div className="flex items-center gap-2">
        <Bot className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">AI Agents</h1>
      </div>
      <p className="text-sm text-muted-foreground mt-1">Monitor and manage your autonomous organizing committee</p>
    </div>
    <AgentStatus />
  </div>
);

export default Agents;
