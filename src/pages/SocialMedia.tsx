import { useState, useEffect } from "react";
import { Share2, Heart, MessageCircle, Eye, Twitter, Linkedin, Instagram, RefreshCw, Sparkles, Clock, Edit3, Copy, Check, MapPin, CalendarDays, Send, Calendar, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

interface GeneratedPost {
  id?: string;
  platform: string;
  caption: string;
  hashtags?: string[];
  suggested_time: string;
  image_url?: string;
  status: 'generated' | 'scheduled' | 'published';
  editing?: boolean;
  editCaption?: string;
  scheduled_time?: string;
}

interface EventDetails {
  event_name: string;
  theme: string;
  date: string;
  location: string;
  description: string;
}

const platformConfig: Record<string, { icon: any; label: string; color: string; bg: string }> = {
  "Instagram": { icon: Instagram, label: "Instagram", color: "text-neon-rose", bg: "bg-neon-rose/10" },
  "LinkedIn": { icon: Linkedin, label: "LinkedIn", color: "text-neon-purple", bg: "bg-neon-purple/10" },
  "Twitter/X": { icon: Twitter, label: "Twitter / X", color: "text-neon-cyan", bg: "bg-neon-cyan/10" },
};

const SocialMedia = () => {
  const { toast } = useToast();
  const [eventDetails, setEventDetails] = useState<EventDetails>({
    event_name: "",
    theme: "",
    date: "",
    location: "",
    description: "",
  });
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [generating, setGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [agentLogs, setAgentLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("generate");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const safeFormat = (dateStr: string, formatStr: string) => {
    try {
      if (!dateStr) return "N/A";
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "N/A";
      return format(date, formatStr);
    } catch (e) {
      return "N/A";
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/agent-logs");
      const data = await response.json();
      setAgentLogs(data);
    } catch (e) {
      console.error("Failed to fetch logs:", e);
    }
  };

  useEffect(() => {
    const interval = setInterval(fetchLogs, 5000);
    fetchLogs();
    return () => clearInterval(interval);
  }, []);

  const generateContent = async () => {
    const { event_name, description } = eventDetails;
    if (!event_name || !description) {
      toast({ title: "Missing info", description: "Please fill in at least the event name and description.", variant: "destructive" });
      return;
    }

    setGenerating(true);
    setPosts([]);

    try {
      const response = await fetch("http://localhost:8000/api/generate-social-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: String(eventDetails.event_name),
          theme: String(eventDetails.theme),
          date: String(eventDetails.date),
          location: String(eventDetails.location),
          description: String(eventDetails.description)
        }),
      });

      if (!response.ok) throw new Error("Backend connection failed");
      const data = await response.json();

      if (!data || !Array.isArray(data.results)) {
        throw new Error("Invalid response format from server");
      }

      const newPosts = data.results.map((p: any) => ({
        ...p,
        platform: String(p.platform || "Platform"),
        caption: String(p.caption || ""),
        suggested_time: String(p.suggested_time || "N/A"),
        status: 'generated'
      }));

      setPosts(newPosts);
      setActiveTab("posts");
      toast({ title: "Success!", description: "Content generated for all platforms." });
    } catch (e: any) {
      console.error("Generation Error:", e);
      toast({ title: "Generation Failed", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const schedulePost = async (index: number) => {
    const post = posts[index];
    if (!post || !selectedDate) {
      toast({ title: "Select Date", description: "Please pick a date for scheduling.", variant: "destructive" });
      return;
    }

    const scheduledTime = selectedDate.toISOString();

    try {
      const response = await fetch("http://localhost:8000/api/schedule-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: String(post.platform),
          caption: String(post.caption),
          image_url: String(post.image_url || ""),
          scheduled_time: scheduledTime
        }),
      });

      if (!response.ok) throw new Error("Scheduling failed");

      setPosts(prev => prev.map((p, i) => i === index ? { ...p, status: 'scheduled', scheduled_time: scheduledTime } : p));
      toast({ title: "Scheduled!", description: `Post for ${post.platform} scheduled.` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleCopy = (text: any, index: number) => {
    const cleanText = String(text || "");
    navigator.clipboard.writeText(cleanText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({ title: "Copied!", description: "Content copied to clipboard." });
  };

  const toggleEdit = (index: number) => {
    setPosts((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, editing: !p.editing, editCaption: p.editing ? undefined : p.caption } : p
      )
    );
  };

  const saveEdit = (index: number) => {
    setPosts((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, caption: p.editCaption || p.caption, editing: false, editCaption: undefined } : p
      )
    );
    toast({ title: "Saved", description: "Caption updated." });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      <div className="animate-fade-in flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Social Media Content Agent</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">AI-powered generation, scheduling, and automated publishing</p>
        </div>

        <div className="flex items-center gap-2 bg-secondary/30 p-2 rounded-lg border border-border">
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">Status</Badge>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-medium border border-emerald-500/20">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            AGENT ACTIVE
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="generate">Generate Campaign</TabsTrigger>
          <TabsTrigger value="posts" disabled={posts.length === 0}>
            Generated Posts ({posts.length})
          </TabsTrigger>
          <TabsTrigger value="logs">Agent Activity Logs</TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-8 glass-card border-primary/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Campaign Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="event_name">Event Name *</Label>
                    <Input
                      id="event_name"
                      placeholder="TechSummit 2026"
                      value={eventDetails.event_name}
                      onChange={(e) => setEventDetails((p) => ({ ...p, event_name: e.target.value }))}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme / Hook</Label>
                    <Input
                      id="theme"
                      placeholder="The Future of Autonomous AI"
                      value={eventDetails.theme}
                      onChange={(e) => setEventDetails((p) => ({ ...p, theme: e.target.value }))}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="date">Event Date</Label>
                    <Input
                      id="date"
                      placeholder="June 12, 2026"
                      value={eventDetails.date}
                      onChange={(e) => setEventDetails((p) => ({ ...p, date: e.target.value }))}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="Virtual / Global"
                      value={eventDetails.location}
                      onChange={(e) => setEventDetails((p) => ({ ...p, location: e.target.value }))}
                      className="bg-background/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Event Summary *</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide details about speakers, key topics, or target audience for better AI generation..."
                    className="min-h-[150px] bg-background/50 resize-none"
                    value={eventDetails.description}
                    onChange={(e) => setEventDetails((p) => ({ ...p, description: e.target.value }))}
                  />
                </div>
              </CardContent>
              <CardFooter className="bg-primary/5 py-4 border-t border-primary/10 flex justify-between">
                <p className="text-xs text-muted-foreground italic max-w-md">The agent will generate captions for LinkedIn, Twitter, and Instagram plus a promotional poster.</p>
                <Button onClick={generateContent} disabled={generating} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300">
                  {generating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Agent Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Full Campaign
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            <div className="lg:col-span-4 space-y-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Agent Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Ollama Model:</span>
                      <span className="font-mono text-primary font-bold">llama3</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Image Gen:</span>
                      <span className="font-mono text-primary font-bold">Pollinations-XL</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Scheduler:</span>
                      <span className="font-mono text-primary font-bold">APScheduler</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <p className="text-[10px] text-muted-foreground">Real-time stats from backend: <span className="text-foreground">Connected</span></p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card overflow-hidden">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="text-xs font-bold uppercase tracking-tight flex items-center gap-2">
                    <Send className="h-3.5 w-3.5" />
                    Live Activity log
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[250px] overflow-y-auto p-4 space-y-3 font-mono text-[10px]">
                    {agentLogs.slice(0, 10).map((log, i) => (
                      <div key={i} className="flex gap-2 border-l border-primary/20 pl-3">
                        <span className="text-muted-foreground shrink-0">{safeFormat(log.timestamp, 'HH:mm:ss')}</span>
                        <span className="text-foreground">{log.action || "No action recorded"}</span>
                      </div>
                    ))}
                    {agentLogs.length === 0 && <p className="text-center text-muted-foreground italic py-10">Waiting for agent activity...</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Generated Posts Tab */}
        <TabsContent value="posts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Generated Campaign Content</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-muted p-1 px-2 rounded-md border border-border">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 text-[11px] px-2">
                      {selectedDate ? format(selectedDate, 'PPP') : 'Pick posting date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <Button variant="outline" size="sm" onClick={() => generateContent()} disabled={generating}>
                <RefreshCw className={`h-4 w-4 mr-2 ${generating ? "animate-spin" : ""}`} />
                Regenerate All
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {Array.isArray(posts) && posts.length > 0 ? posts.map((post, i) => {
              if (!post) return null;

              const platformName = post.platform || "Platform";
              const cfg = platformConfig[platformName] || {
                icon: Share2,
                label: platformName,
                color: "text-primary",
                bg: "bg-primary/10"
              };

              const Icon = cfg.icon || Share2;
              const status = post.status || 'generated';
              const caption = post.caption || "No caption generated.";
              const imageUrl = post.image_url || "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80";

              return (
                <Card key={i} className={`glass-card flex flex-col h-full border-t-4 transition-all duration-300 ${status === 'scheduled' ? 'border-primary' : status === 'published' ? 'border-emerald-500' : 'border-muted'}`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${cfg.bg}`}>
                          <Icon className={`h-5 w-5 ${cfg.color}`} />
                        </div>
                        <div>
                          <p className="font-bold text-sm tracking-tight">{cfg.label}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{status}</p>
                        </div>
                      </div>
                      {status === 'scheduled' && <CheckCircle2 className="h-5 w-5 text-primary animate-in zoom-in-50 duration-300" />}
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <div className="relative group rounded-lg overflow-hidden border border-border/50 bg-muted/20 aspect-video">
                      <img
                        src={imageUrl}
                        alt="Event Poster"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80";
                        }}
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <Badge variant="secondary" className="text-[9px] bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border-white/20">AI GENERATED POSTER</Badge>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium"><Clock className="h-3.5 w-3.5" /> {post.suggested_time || "Priority: High"}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => toggleEdit(i)}>
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {post.editing ? (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                          <Textarea
                            value={post.editCaption ?? caption}
                            onChange={(e) =>
                              setPosts((prev) => prev.map((p, idx) => (idx === i ? { ...p, editCaption: e.target.value } : p)))
                            }
                            className="text-xs min-h-[140px] bg-background/50 border-primary/20 focus:border-primary/50"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveEdit(i)} className="h-8 text-[10px] bg-primary/20 text-primary border-primary/10 hover:bg-primary/30">Save Changes</Button>
                            <Button size="sm" variant="ghost" onClick={() => toggleEdit(i)} className="h-8 text-[10px] text-muted-foreground">Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="group relative">
                          <p className="text-xs text-muted-foreground leading-relaxed bg-secondary/10 p-4 rounded-xl border border-border/10 whitespace-pre-line min-h-[120px]">
                            {caption}
                          </p>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Badge variant="outline" className="text-[9px] bg-background/80 backdrop-blur-sm">PREVIEW</Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 flex gap-2">
                    <Button variant="secondary" className="flex-1 text-[11px] h-10 bg-secondary/30 hover:bg-secondary/50 border-border/10 transition-all font-semibold" onClick={() => handleCopy(caption, i)}>
                      {copiedIndex === i ? (
                        <><Check className="h-3.5 w-3.5 mr-1.5 text-emerald-500" /> Copied</>
                      ) : (
                        <><Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Content</>
                      )}
                    </Button>
                    <Button
                      className={`flex-1 text-[11px] h-10 transition-all font-semibold shadow-md ${status === 'scheduled' ? 'bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20' : 'bg-primary text-primary-foreground hover:shadow-primary/20'}`}
                      disabled={status === 'scheduled'}
                      onClick={() => schedulePost(i)}
                    >
                      {status === 'scheduled' ? (
                        <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Scheduled</>
                      ) : (
                        <><Calendar className="h-3.5 w-3.5 mr-1.5" /> Schedule Post</>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            }) : (
              <div className="col-span-full py-20 text-center space-y-4">
                <div className="inline-flex p-4 rounded-full bg-muted/30">
                  <Sparkles className="h-8 w-8 text-primary/40" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-medium">No results to display</p>
                  <p className="text-sm text-muted-foreground">Configure and generate a campaign to see AI content here.</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Agent Execution History
                </CardTitle>
                <p className="text-xs text-muted-foreground">Audit trail of all autonomous social media operations</p>
              </div>
              <Button variant="outline" size="sm" onClick={fetchLogs}>
                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                Refresh Logs
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-border overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Timestamp</th>
                      <th className="px-4 py-3 font-semibold">Action</th>
                      <th className="px-4 py-3 font-semibold">Platform</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {agentLogs.map((log, i) => (
                      <tr key={i} className="hover:bg-secondary/20 transition-colors">
                        <td className="px-4 py-3 font-mono text-muted-foreground">{safeFormat(log.timestamp, 'PPpp')}</td>
                        <td className="px-4 py-3 font-medium">{log.action}</td>
                        <td className="px-4 py-3">
                          {log.platform ? (
                            <Badge variant="outline" className="text-[9px] uppercase">{log.platform}</Badge>
                          ) : (
                            <span className="text-muted-foreground">System</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-emerald-500">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            COMPLETED
                          </div>
                        </td>
                      </tr>
                    ))}
                    {agentLogs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground italic">No logs found. Generate some content to start tracking.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialMedia;
