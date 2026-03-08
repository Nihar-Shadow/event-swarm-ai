import { useState, useEffect, useCallback } from "react";
import {
  CalendarClock, Clock, MapPin, AlertTriangle, CheckCircle2, Plus,
  Trash2, Users, Building2, Sparkles, RefreshCw, LayoutGrid, GanttChart, Terminal, Edit3, Save, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, differenceInMinutes, addMinutes, startOfDay, setHours, isValid } from "date-fns";

// Types
interface Speaker {
  id: string;
  name: string;
  bio: string | null;
  email: string | null;
  topic: string | null;
}

interface Room {
  id: string;
  name: string;
  capacity: number | null;
}

interface Session {
  id: string;
  title: string;
  description: string | null;
  speaker_id: string | null;
  room_id: string | null;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number;
  status: string;
  has_conflict: boolean;
  conflict_note: string | null;
  speakers?: Speaker;
  rooms?: Room;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8AM - 7PM

const Scheduler = () => {
  const { toast } = useToast();
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [agentLogs, setAgentLogs] = useState<string[]>([]);
  const [optimizing, setOptimizing] = useState(false);
  const [eventDate, setEventDate] = useState("2026-03-15");

  // Form states
  const [newSpeaker, setNewSpeaker] = useState({ name: "", bio: "", email: "", topic: "" });
  const [newRoom, setNewRoom] = useState({ name: "", capacity: "" });
  const [newSession, setNewSession] = useState({ title: "", description: "", speaker_id: "", room_id: "", duration_minutes: "60" });
  const [speakerDialogOpen, setSpeakerDialogOpen] = useState(false);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);

  const addLog = useCallback((msg: string) => {
    setAgentLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  }, []);

  // Fetch data
  const fetchAll = useCallback(async () => {
    const [sp, rm, ss] = await Promise.all([
      supabase.from("speakers").select("*").order("name"),
      supabase.from("rooms").select("*").order("name"),
      supabase.from("sessions").select("*, speakers(*), rooms(*)").order("start_time", { ascending: true, nullsFirst: false }),
    ]);
    if (sp.data) setSpeakers(sp.data);
    if (rm.data) setRooms(rm.data);
    if (ss.data) setSessions(ss.data as any);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // CRUD
  const addSpeaker = async () => {
    if (!newSpeaker.name) return;
    const { error } = await supabase.from("speakers").insert({ name: newSpeaker.name, bio: newSpeaker.bio || null, email: newSpeaker.email || null, topic: newSpeaker.topic || null });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setNewSpeaker({ name: "", bio: "", email: "", topic: "" });
    setSpeakerDialogOpen(false);
    fetchAll();
    toast({ title: "Speaker added" });
  };

  const addRoom = async () => {
    if (!newRoom.name) return;
    const { error } = await supabase.from("rooms").insert({ name: newRoom.name, capacity: newRoom.capacity ? parseInt(newRoom.capacity) : 0 });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setNewRoom({ name: "", capacity: "" });
    setRoomDialogOpen(false);
    fetchAll();
    toast({ title: "Room added" });
  };

  const addSession = async () => {
    if (!newSession.title) return;
    const { error } = await supabase.from("sessions").insert({
      title: newSession.title,
      description: newSession.description || null,
      speaker_id: newSession.speaker_id || null,
      room_id: newSession.room_id || null,
      duration_minutes: parseInt(newSession.duration_minutes) || 60,
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setNewSession({ title: "", description: "", speaker_id: "", room_id: "", duration_minutes: "60" });
    setSessionDialogOpen(false);
    fetchAll();
    toast({ title: "Session added" });
  };

  const deleteSpeaker = async (id: string) => { await supabase.from("speakers").delete().eq("id", id); fetchAll(); };
  const deleteRoom = async (id: string) => { await supabase.from("rooms").delete().eq("id", id); fetchAll(); };
  const deleteSession = async (id: string) => { await supabase.from("sessions").delete().eq("id", id); fetchAll(); };

  // AI Schedule Optimization
  const optimizeSchedule = async () => {
    if (sessions.length === 0 || rooms.length === 0) {
      toast({ title: "Need data", description: "Add at least one session and one room first.", variant: "destructive" });
      return;
    }
    setOptimizing(true);
    addLog("[Scheduler Agent] Creating schedule...");
    addLog(`[Scheduler Agent] Processing ${sessions.length} sessions across ${rooms.length} rooms`);

    try {
      const sessionsPayload = sessions.map(s => ({
        id: s.id,
        title: s.title,
        speaker_name: s.speakers?.name || null,
        speaker_id: s.speaker_id,
        room_name: s.rooms?.name || null,
        room_id: s.room_id,
        duration_minutes: s.duration_minutes,
      }));
      const roomsPayload = rooms.map(r => ({ id: r.id, name: r.name }));

      const { data, error } = await supabase.functions.invoke("optimize-schedule", {
        body: { sessions: sessionsPayload, rooms: roomsPayload, event_date: eventDate, event_start_hour: "09:00", event_end_hour: "18:00" },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Apply schedule to sessions
      const schedule = data.schedule || [];
      const logs: string[] = data.logs || [];
      logs.forEach(l => addLog(l));

      for (const slot of schedule) {
        await supabase.from("sessions").update({
          start_time: slot.start_time,
          end_time: slot.end_time,
          room_id: slot.room_id,
          has_conflict: slot.has_conflict || false,
          conflict_note: slot.conflict_note || null,
          status: "scheduled",
        }).eq("id", slot.session_id);
      }

      addLog(`[Scheduler Agent] Schedule applied — ${schedule.length} sessions scheduled`);
      if (data.summary) addLog(`[Scheduler Agent] ${data.summary}`);
      toast({ title: "Schedule optimized!", description: data.summary || "All sessions have been scheduled." });
      fetchAll();
    } catch (e: any) {
      addLog(`[Scheduler Agent] ✗ Error: ${e.message}`);
      toast({ title: "Optimization failed", description: e.message, variant: "destructive" });
    } finally {
      setOptimizing(false);
    }
  };

  const scheduledSessions = sessions.filter(s => s.start_time && s.end_time);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Event Scheduler</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">AI-powered conflict-free event scheduling</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Speakers", value: speakers.length, icon: Users, color: "text-neon-cyan" },
          { label: "Rooms", value: rooms.length, icon: Building2, color: "text-neon-purple" },
          { label: "Sessions", value: sessions.length, icon: CalendarClock, color: "text-neon-green" },
          { label: "Conflicts", value: sessions.filter(s => s.has_conflict).length, icon: AlertTriangle, color: "text-neon-amber" },
        ].map((s, i) => (
          <div key={s.label} className="glass-card rounded-xl p-4 animate-fade-in" style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
            <div className={`${s.color} mb-2`}><s.icon className="h-4 w-4" /></div>
            <p className="text-xl font-bold font-mono">{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="manage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="manage">Manage</TabsTrigger>
          <TabsTrigger value="calendar" disabled={scheduledSessions.length === 0}>
            <LayoutGrid className="h-3 w-3 mr-1" />Calendar
          </TabsTrigger>
          <TabsTrigger value="timeline" disabled={scheduledSessions.length === 0}>
            <GanttChart className="h-3 w-3 mr-1" />Timeline
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Terminal className="h-3 w-3 mr-1" />Logs
          </TabsTrigger>
        </TabsList>

        {/* Manage Tab */}
        <TabsContent value="manage" className="space-y-6">
          {/* Event Date + Optimize */}
          <Card className="glass-card">
            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="space-y-2">
                <Label>Event Date</Label>
                <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-48" />
              </div>
              <Button onClick={optimizeSchedule} disabled={optimizing} className="gap-2">
                {optimizing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {optimizing ? "Optimizing..." : "Auto-Schedule with AI"}
              </Button>
            </CardContent>
          </Card>

          {/* Speakers Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold flex items-center gap-2"><Users className="h-3.5 w-3.5 text-neon-cyan" />Speakers</h2>
              <Dialog open={speakerDialogOpen} onOpenChange={setSpeakerDialogOpen}>
                <DialogTrigger asChild><Button variant="outline" size="sm"><Plus className="h-3 w-3" />Add Speaker</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Speaker</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1"><Label>Name *</Label><Input placeholder="Dr. Sarah Chen" value={newSpeaker.name} onChange={e => setNewSpeaker(p => ({ ...p, name: e.target.value }))} /></div>
                    <div className="space-y-1"><Label>Email</Label><Input placeholder="sarah@example.com" value={newSpeaker.email} onChange={e => setNewSpeaker(p => ({ ...p, email: e.target.value }))} /></div>
                    <div className="space-y-1"><Label>Topic</Label><Input placeholder="AI & Machine Learning" value={newSpeaker.topic} onChange={e => setNewSpeaker(p => ({ ...p, topic: e.target.value }))} /></div>
                    <div className="space-y-1"><Label>Bio</Label><Textarea placeholder="Brief bio..." value={newSpeaker.bio} onChange={e => setNewSpeaker(p => ({ ...p, bio: e.target.value }))} /></div>
                    <Button onClick={addSpeaker} className="w-full">Add Speaker</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {speakers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No speakers added yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {speakers.map(sp => (
                  <div key={sp.id} className="glass-card rounded-lg p-3 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{sp.name}</p>
                      {sp.topic && <p className="text-xs text-muted-foreground truncate">{sp.topic}</p>}
                      {sp.email && <p className="text-[10px] text-muted-foreground font-mono">{sp.email}</p>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => deleteSpeaker(sp.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rooms Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-neon-purple" />Rooms</h2>
              <Dialog open={roomDialogOpen} onOpenChange={setRoomDialogOpen}>
                <DialogTrigger asChild><Button variant="outline" size="sm"><Plus className="h-3 w-3" />Add Room</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Room</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1"><Label>Room Name *</Label><Input placeholder="Main Stage" value={newRoom.name} onChange={e => setNewRoom(p => ({ ...p, name: e.target.value }))} /></div>
                    <div className="space-y-1"><Label>Capacity</Label><Input type="number" placeholder="200" value={newRoom.capacity} onChange={e => setNewRoom(p => ({ ...p, capacity: e.target.value }))} /></div>
                    <Button onClick={addRoom} className="w-full">Add Room</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {rooms.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No rooms added yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {rooms.map(rm => (
                  <Badge key={rm.id} variant="secondary" className="gap-1.5 px-3 py-1.5">
                    <Building2 className="h-3 w-3" />{rm.name}{rm.capacity ? ` (${rm.capacity})` : ""}
                    <button onClick={() => deleteRoom(rm.id)} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Sessions Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold flex items-center gap-2"><CalendarClock className="h-3.5 w-3.5 text-neon-green" />Sessions</h2>
              <Dialog open={sessionDialogOpen} onOpenChange={setSessionDialogOpen}>
                <DialogTrigger asChild><Button variant="outline" size="sm"><Plus className="h-3 w-3" />Add Session</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Session</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-1"><Label>Title *</Label><Input placeholder="Opening Keynote" value={newSession.title} onChange={e => setNewSession(p => ({ ...p, title: e.target.value }))} /></div>
                    <div className="space-y-1"><Label>Description</Label><Textarea placeholder="Session description..." value={newSession.description} onChange={e => setNewSession(p => ({ ...p, description: e.target.value }))} /></div>
                    <div className="space-y-1">
                      <Label>Speaker</Label>
                      <Select value={newSession.speaker_id} onValueChange={v => setNewSession(p => ({ ...p, speaker_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select speaker" /></SelectTrigger>
                        <SelectContent>{speakers.map(sp => <SelectItem key={sp.id} value={sp.id}>{sp.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Preferred Room</Label>
                      <Select value={newSession.room_id} onValueChange={v => setNewSession(p => ({ ...p, room_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select room" /></SelectTrigger>
                        <SelectContent>{rooms.map(rm => <SelectItem key={rm.id} value={rm.id}>{rm.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1"><Label>Duration (minutes)</Label><Input type="number" value={newSession.duration_minutes} onChange={e => setNewSession(p => ({ ...p, duration_minutes: e.target.value }))} /></div>
                    <Button onClick={addSession} className="w-full">Add Session</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No sessions added yet.</p>
            ) : (
              <div className="space-y-2">
                {sessions.map(s => (
                  <div key={s.id} className={`glass-card rounded-xl p-4 flex items-center gap-4 ${s.has_conflict ? "neon-border border-neon-amber/40" : ""}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{s.title}</p>
                        <Badge variant={s.status === "scheduled" ? "default" : "secondary"} className="text-[10px]">{s.status}</Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {s.speakers && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{s.speakers.name}</span>}
                        {s.rooms && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{s.rooms.name}</span>}
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{s.duration_minutes}min</span>
                        {s.start_time && <span className="font-mono">{format(parseISO(s.start_time), "HH:mm")} — {s.end_time ? format(parseISO(s.end_time), "HH:mm") : ""}</span>}
                      </div>
                    </div>
                    {s.has_conflict ? (
                      <div className="text-right shrink-0">
                        <span className="flex items-center gap-1 text-[10px] font-mono text-neon-amber px-2 py-0.5 rounded bg-neon-amber/10">
                          <AlertTriangle className="h-3 w-3" />CONFLICT
                        </span>
                        {s.conflict_note && <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px]">{s.conflict_note}</p>}
                      </div>
                    ) : s.status === "scheduled" ? (
                      <CheckCircle2 className="h-4 w-4 text-neon-green shrink-0" />
                    ) : null}
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => deleteSession(s.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Calendar View */}
        <TabsContent value="calendar" className="space-y-4">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-primary" />
                Calendar View — {eventDate}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-[700px]">
                  {/* Header row with rooms */}
                  <div className="grid gap-1" style={{ gridTemplateColumns: `60px repeat(${rooms.length || 1}, 1fr)` }}>
                    <div className="text-[10px] text-muted-foreground font-mono p-1">Time</div>
                    {rooms.map(r => (
                      <div key={r.id} className="text-xs font-semibold text-center p-1 rounded bg-secondary">{r.name}</div>
                    ))}
                  </div>
                  {/* Time rows */}
                  {HOURS.map(hour => (
                    <div key={hour} className="grid gap-1 border-t border-border/30 min-h-[60px]" style={{ gridTemplateColumns: `60px repeat(${rooms.length || 1}, 1fr)` }}>
                      <div className="text-[10px] text-muted-foreground font-mono p-1 pt-2">{String(hour).padStart(2, "0")}:00</div>
                      {rooms.map(r => {
                        const sessionsInSlot = scheduledSessions.filter(s => {
                          if (!s.start_time || s.room_id !== r.id) return false;
                          const startHour = parseISO(s.start_time).getHours();
                          return startHour === hour;
                        });
                        return (
                          <div key={r.id} className="p-0.5 space-y-0.5">
                            {sessionsInSlot.map(s => (
                              <div
                                key={s.id}
                                className={`rounded-lg p-2 text-xs ${s.has_conflict ? "bg-neon-amber/10 border border-neon-amber/30" : "bg-primary/10 border border-primary/20"}`}
                              >
                                <p className="font-medium truncate">{s.title}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {s.start_time && format(parseISO(s.start_time), "HH:mm")}–{s.end_time && format(parseISO(s.end_time), "HH:mm")}
                                </p>
                                {s.speakers && <p className="text-[10px] text-muted-foreground">{s.speakers.name}</p>}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline View */}
        <TabsContent value="timeline" className="space-y-4">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <GanttChart className="h-4 w-4 text-primary" />
                Timeline View — {eventDate}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {/* Time axis */}
                <div className="flex ml-28">
                  {HOURS.map(h => (
                    <div key={h} className="flex-1 text-[10px] text-muted-foreground font-mono">{String(h).padStart(2, "0")}:00</div>
                  ))}
                </div>
                {/* Room rows */}
                {rooms.map(room => {
                  const roomSessions = scheduledSessions.filter(s => s.room_id === room.id);
                  return (
                    <div key={room.id} className="flex items-stretch gap-2 min-h-[48px]">
                      <div className="w-28 shrink-0 flex items-center">
                        <span className="text-xs font-medium truncate">{room.name}</span>
                      </div>
                      <div className="flex-1 relative bg-secondary/30 rounded-lg">
                        {roomSessions.map(s => {
                          if (!s.start_time || !s.end_time) return null;
                          const start = parseISO(s.start_time);
                          const end = parseISO(s.end_time);
                          const dayStart = setHours(startOfDay(start), 8);
                          const totalMinutes = 12 * 60; // 8AM to 8PM
                          const offsetMin = differenceInMinutes(start, dayStart);
                          const durationMin = differenceInMinutes(end, start);
                          const leftPct = Math.max(0, (offsetMin / totalMinutes) * 100);
                          const widthPct = Math.max(2, (durationMin / totalMinutes) * 100);

                          return (
                            <div
                              key={s.id}
                              className={`absolute top-1 bottom-1 rounded-md px-2 py-1 text-[10px] overflow-hidden flex flex-col justify-center ${s.has_conflict ? "bg-neon-amber/20 border border-neon-amber/40" : "bg-primary/20 border border-primary/30"}`}
                              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                              title={`${s.title} (${format(start, "HH:mm")}–${format(end, "HH:mm")})`}
                            >
                              <p className="font-medium truncate">{s.title}</p>
                              <p className="text-muted-foreground truncate">{s.speakers?.name || ""}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" />
                Scheduler Agent Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {agentLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No activity yet. Use "Auto-Schedule with AI" to see agent logs.</p>
              ) : (
                <div className="space-y-1 max-h-[400px] overflow-y-auto font-mono text-xs">
                  {agentLogs.map((log, i) => (
                    <div key={i} className={`py-1.5 px-2 rounded ${log.includes("✓") || log.includes("Success") || log.includes("applied") ? "text-neon-green" : log.includes("✗") || log.includes("Error") ? "text-destructive" : log.includes("Conflict") || log.includes("conflict") ? "text-neon-amber" : "text-muted-foreground"}`}>
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Scheduler;
