import { Settings as SettingsIcon, User, Bell, Shield, Palette, Globe } from "lucide-react";

const sections = [
  { icon: User, title: "Profile", desc: "Manage your account details and preferences" },
  { icon: Bell, title: "Notifications", desc: "Configure alert thresholds and delivery channels" },
  { icon: Shield, title: "Security", desc: "API keys, two-factor auth, and access control" },
  { icon: Palette, title: "Appearance", desc: "Theme, layout density, and display options" },
  { icon: Globe, title: "Integrations", desc: "Connect external services and webhooks" },
];

const SettingsPage = () => (
  <div className="space-y-6 max-w-3xl mx-auto">
    <div className="animate-fade-in">
      <div className="flex items-center gap-2">
        <SettingsIcon className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </div>
      <p className="text-sm text-muted-foreground mt-1">Configure your Swarm AI platform</p>
    </div>

    <div className="space-y-3">
      {sections.map((s, i) => (
        <div
          key={s.title}
          className="glass-card rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:bg-secondary/50 transition-colors animate-fade-in"
          style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}
        >
          <div className="p-2.5 rounded-lg bg-secondary text-primary">
            <s.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">{s.title}</p>
            <p className="text-xs text-muted-foreground">{s.desc}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default SettingsPage;
