import { Share2, Heart, MessageCircle, Repeat2, Eye, Twitter, Linkedin, Instagram } from "lucide-react";

const posts = [
  { platform: "Twitter", icon: Twitter, content: "🚀 TechSummit 2026 speaker lineup revealed! Don't miss Dr. Sarah Chen's keynote on AI-driven infrastructure...", likes: 342, comments: 56, shares: 128, impressions: "12.4K", status: "Published", time: "2 hrs ago" },
  { platform: "LinkedIn", icon: Linkedin, content: "Excited to announce our partnership with CloudScale for TechSummit 2026. Together, we're bringing cutting-edge workshops...", likes: 891, comments: 134, shares: 267, impressions: "34.2K", status: "Published", time: "5 hrs ago" },
  { platform: "Instagram", icon: Instagram, content: "Behind the scenes at TechSummit prep! Our AI swarm is working overtime to make this the best event yet 🤖✨", likes: 1203, comments: 89, shares: 45, impressions: "18.7K", status: "Published", time: "1 day ago" },
  { platform: "Twitter", icon: Twitter, content: "⏰ Early bird registration closes in 48 hours! Grab your spot at TechSummit 2026 before prices go up...", likes: 0, comments: 0, shares: 0, impressions: "—", status: "Scheduled", time: "Tomorrow 9AM" },
  { platform: "LinkedIn", icon: Linkedin, content: "Workshop spotlight: LLM Fine-Tuning with Alex Petrov. Limited seats available for this hands-on deep dive...", likes: 0, comments: 0, shares: 0, impressions: "—", status: "Draft", time: "—" },
];

const platformColor = (p: string) =>
  p === "Twitter" ? "text-neon-cyan" : p === "LinkedIn" ? "text-neon-purple" : "text-neon-rose";

const statusStyle = (s: string) =>
  s === "Published" ? "bg-neon-green/10 text-neon-green" :
  s === "Scheduled" ? "bg-neon-cyan/10 text-neon-cyan" :
  "bg-muted text-muted-foreground";

const SocialMedia = () => (
  <div className="space-y-6 max-w-7xl mx-auto">
    <div className="animate-fade-in">
      <div className="flex items-center gap-2">
        <Share2 className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Social Media Agent</h1>
      </div>
      <p className="text-sm text-muted-foreground mt-1">AI-generated and managed social media content</p>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: "Total Posts", value: "326", icon: Share2, color: "text-neon-cyan" },
        { label: "Total Engagement", value: "48.2K", icon: Heart, color: "text-neon-rose" },
        { label: "Impressions", value: "284K", icon: Eye, color: "text-neon-purple" },
        { label: "Scheduled", value: "12", icon: MessageCircle, color: "text-neon-amber" },
      ].map((s, i) => (
        <div key={s.label} className="glass-card rounded-xl p-4 animate-fade-in" style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
          <div className={`${s.color} mb-2`}><s.icon className="h-4 w-4" /></div>
          <p className="text-xl font-bold font-mono">{s.value}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
        </div>
      ))}
    </div>

    <div className="space-y-4">
      {posts.map((p, i) => (
        <div key={i} className="glass-card rounded-xl p-5 animate-fade-in" style={{ animationDelay: `${(i + 4) * 60}ms`, animationFillMode: "both" }}>
          <div className="flex items-start gap-4">
            <div className={`p-2 rounded-lg bg-secondary ${platformColor(p.platform)}`}>
              <p.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold">{p.platform}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${statusStyle(p.status)}`}>{p.status}</span>
                <span className="text-[10px] text-muted-foreground font-mono ml-auto">{p.time}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.content}</p>
              {p.status === "Published" && (
                <div className="flex items-center gap-6 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{p.likes}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{p.comments}</span>
                  <span className="flex items-center gap-1"><Repeat2 className="h-3 w-3" />{p.shares}</span>
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{p.impressions}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default SocialMedia;
