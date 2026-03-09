import { useState, useEffect, useCallback } from "react";
import { Mail, Send, FileUp, Eye, Play, Clock, CheckCircle2, AlertCircle, XCircle, Loader2, Bot } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useParticipants } from "@/hooks/use-participants";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCampaigns,
  createCampaign,
  updateCampaignStatus,
  fetchEmailLogs,
  insertEmailLogs,
  updateEmailLogStatus,
  personalizeEmails,
  sendBulkEmails,
  fetchAgentEmailLogs,
  type EmailCampaign,
  type EmailLog,
} from "@/lib/email-campaigns";
import { toast } from "@/hooks/use-toast";
import { CSVUploader } from "@/components/participants/CSVUploader";

type Tab = "compose" | "preview" | "logs";

const statusIcon = (s: string) => {
  if (s === "sent") return <CheckCircle2 className="h-3.5 w-3.5 text-neon-green" />;
  if (s === "failed") return <XCircle className="h-3.5 w-3.5 text-destructive" />;
  if (s === "sending") return <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />;
  return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
};

const EmailAutomation = () => {
  const [tab, setTab] = useState<Tab>("compose");
  const [subjectTemplate, setSubjectTemplate] = useState("Welcome to {event_name}, {name}!");
  const [bodyTemplate, setBodyTemplate] = useState(
    `Hello {name},\n\nThank you for registering for {event_name}.\nYour team {team_name} has successfully registered.\n\nWe look forward to seeing you there!\n\nBest regards,\nEvent Team`
  );
  const [eventName, setEventName] = useState("TechSummit 2026");
  const [previewEmails, setPreviewEmails] = useState<any[]>([]);
  const [previewIdx, setPreviewIdx] = useState(0);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [agentLogs, setAgentLogs] = useState<{ time: string; message: string; type: "info" | "success" | "error" }[]>([]);
  const [isSending, setIsSending] = useState(false);

  const qc = useQueryClient();
  const { data: participants = [], isLoading: loadingParticipants } = useParticipants();
  const { data: campaigns = [] } = useQuery({ queryKey: ["email_campaigns"], queryFn: fetchCampaigns });
  const { data: logs = [] } = useQuery({
    queryKey: ["email_logs"],
    queryFn: fetchAgentEmailLogs,
    refetchInterval: isSending ? 2000 : false, // Auto refresh while sending
  });

  const addLog = useCallback((message: string, type: "info" | "success" | "error" = "info") => {
    const time = new Date().toLocaleTimeString();
    setAgentLogs((prev) => [{ time, message, type }, ...prev]);
  }, []);

  // Generate previews
  const handlePreview = async () => {
    if (participants.length === 0) {
      toast({ title: "No participants", description: "Upload participants first.", variant: "destructive" });
      return;
    }
    addLog(`Generating personalized previews for ${participants.length} participants...`);
    try {
      const result = await personalizeEmails(subjectTemplate, bodyTemplate, participants, eventName);
      setPreviewEmails(result);
      setPreviewIdx(0);
      setTab("preview");
      addLog(`Preview generated for ${result.length} participants`, "success");
    } catch (err: any) {
      addLog(`Preview failed: ${err.message}`, "error");
      toast({ title: "Preview failed", description: err.message, variant: "destructive" });
    }
  };

  // Send real bulk emails via Python backend
  const handleSend = async () => {
    if (participants.length === 0) {
      toast({ title: "No participants", description: "Upload participants first.", variant: "destructive" });
      return;
    }

    setIsSending(true);
    addLog(`[Email Agent] Requesting bulk send to Python backend...`);

    try {
      const result = await sendBulkEmails(subjectTemplate, bodyTemplate, participants, eventName);

      addLog(`[Email Agent] Success! Sent: ${result.sent}, Failed: ${result.failed}`, "success");
      toast({
        title: "Campaign dispatched",
        description: `Successfully sent ${result.sent} emails. ${result.failed} failed.`
      });

      qc.invalidateQueries({ queryKey: ["email_logs"] });
      setTab("logs");
    } catch (err: any) {
      addLog(`[Email Agent] ✗ Sending failed: ${err.message}`, "error");
      toast({ title: "Send failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const participantsWithEmail = participants.filter((p) => p.email);
  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: "compose", label: "Compose", icon: Mail },
    { key: "preview", label: "Preview", icon: Eye },
    { key: "logs", label: "Delivery Logs", icon: Clock },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Email Automation</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">AI-powered personalized email campaigns for your event participants</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Participants", value: participants.length, icon: Mail, color: "text-primary" },
          { label: "With Email", value: participantsWithEmail.length, icon: Send, color: "text-neon-green" },
          { label: "Campaigns", value: campaigns.length, icon: FileUp, color: "text-accent" },
          { label: "Emails Sent", value: campaigns.reduce((s, c) => s + (c.sent_count || 0), 0), icon: CheckCircle2, color: "text-neon-amber" },
        ].map((s, i) => (
          <div key={s.label} className="glass-card rounded-xl p-4 animate-fade-in" style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
            <div className={`${s.color} mb-2`}><s.icon className="h-4 w-4" /></div>
            <p className="text-xl font-bold font-mono">{s.value.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary/50 rounded-lg p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {tab === "compose" && (
            <>
              {/* CSV Upload */}
              <div className="glass-card rounded-xl p-5 animate-fade-in">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <FileUp className="h-4 w-4 text-primary" /> Upload Participants
                </h3>
                <CSVUploader />
                {participants.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-3">
                    ✓ {participants.length} participants loaded ({participantsWithEmail.length} with email)
                  </p>
                )}
              </div>

              {/* Template editor */}
              <div className="glass-card rounded-xl p-5 animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" /> Email Template
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Event Name</Label>
                    <Input value={eventName} onChange={(e) => setEventName(e.target.value)} className="mt-1 bg-secondary/50" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Subject Template</Label>
                    <Input value={subjectTemplate} onChange={(e) => setSubjectTemplate(e.target.value)} className="mt-1 bg-secondary/50" />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Body Template</Label>
                    <Textarea
                      value={bodyTemplate}
                      onChange={(e) => setBodyTemplate(e.target.value)}
                      className="mt-1 bg-secondary/50 min-h-[200px] font-mono text-sm"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {["{name}", "{email}", "{team_name}", "{college}", "{event_name}", "{segment}"].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setBodyTemplate((b) => b + " " + tag)}
                        className="text-[10px] font-mono px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handlePreview}
                      disabled={loadingParticipants}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" /> Preview Emails
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={isSending || participants.length === 0}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      {isSending ? "Sending..." : "Send Bulk Emails"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === "preview" && (
            <div className="glass-card rounded-xl p-5 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" /> Email Preview
                </h3>
                {previewEmails.length > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewIdx((i) => Math.max(0, i - 1))}
                      disabled={previewIdx === 0}
                      className="text-xs px-2 py-1 rounded bg-secondary hover:bg-secondary/80 disabled:opacity-40"
                    >
                      ← Prev
                    </button>
                    <span className="text-xs text-muted-foreground font-mono">
                      {previewIdx + 1}/{previewEmails.length}
                    </span>
                    <button
                      onClick={() => setPreviewIdx((i) => Math.min(previewEmails.length - 1, i + 1))}
                      disabled={previewIdx >= previewEmails.length - 1}
                      className="text-xs px-2 py-1 rounded bg-secondary hover:bg-secondary/80 disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
              {previewEmails.length > 0 ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-secondary/50 p-4 space-y-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">To</span>
                      <p className="text-sm font-medium">
                        {previewEmails[previewIdx]?.participant_name}{" "}
                        <span className="text-muted-foreground font-mono text-xs">
                          &lt;{previewEmails[previewIdx]?.participant_email || "no email"}&gt;
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Subject</span>
                      <p className="text-sm font-semibold">{previewEmails[previewIdx]?.personalized_subject}</p>
                    </div>
                    <div className="border-t border-border/50 pt-3">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Body</span>
                      <pre className="text-sm whitespace-pre-wrap font-sans mt-1 leading-relaxed">
                        {previewEmails[previewIdx]?.personalized_body}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No previews yet. Go to Compose and click "Preview Emails".
                </p>
              )}
            </div>
          )}

          {tab === "logs" && (
            <div className="glass-card rounded-xl p-5 animate-fade-in">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Delivery Logs
              </h3>
              {/* Campaign selector */}
              {campaigns.length > 0 && (
                <div className="flex gap-2 mb-4 flex-wrap">
                  {campaigns.slice(0, 5).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCampaignId(c.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${selectedCampaignId === c.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      {c.event_name} — {new Date(c.created_at).toLocaleDateString()}
                    </button>
                  ))}
                </div>
              )}
              {logs.length > 0 ? (
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left p-2 text-xs font-medium text-muted-foreground">Status</th>
                        <th className="text-left p-2 text-xs font-medium text-muted-foreground">Recipient</th>
                        <th className="text-left p-2 text-xs font-medium text-muted-foreground hidden md:table-cell">Subject</th>
                        <th className="text-left p-2 text-xs font-medium text-muted-foreground hidden sm:table-cell">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log: any, idx: number) => (
                        <tr key={log.id || idx} className="border-b border-border/20 hover:bg-secondary/30">
                          <td className="p-2">{statusIcon(log.status)}</td>
                          <td className="p-2">
                            <p className="font-medium text-xs">{log.participant_name || log.email.split('@')[0]}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">{log.participant_email || log.email || "—"}</p>
                            {log.error_message && <p className="text-[8px] text-destructive italic">{log.error_message}</p>}
                          </td>
                          <td className="p-2 text-xs text-muted-foreground truncate max-w-[200px] hidden md:table-cell">
                            {log.personalized_subject || "Bulk Send"}
                          </td>
                          <td className="p-2 text-[10px] text-muted-foreground font-mono hidden sm:table-cell">
                            {log.sent_at || log.timestamp ? new Date(log.sent_at || log.timestamp).toLocaleTimeString() : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {selectedCampaignId ? "No logs for this campaign yet." : "Select a campaign to view delivery logs."}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Agent Activity Sidebar */}
        <div className="space-y-4">
          {/* Previous campaigns */}
          <div className="glass-card rounded-xl p-4 animate-fade-in" style={{ animationDelay: "150ms", animationFillMode: "both" }}>
            <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider text-muted-foreground">Campaign History</h3>
            {campaigns.length > 0 ? (
              <div className="space-y-2">
                {campaigns.slice(0, 5).map((c) => (
                  <div
                    key={c.id}
                    onClick={() => { setSelectedCampaignId(c.id); setTab("logs"); }}
                    className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors cursor-pointer"
                  >
                    <p className="text-xs font-medium truncate">{c.event_name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-muted-foreground">{c.total_recipients} recipients</span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${c.status === "completed" ? "bg-neon-green/10 text-neon-green" :
                        c.status === "sending" ? "bg-primary/10 text-primary" :
                          "bg-muted text-muted-foreground"
                        }`}>{c.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No campaigns yet.</p>
            )}
          </div>

          {/* Agent logs */}
          <div className="glass-card rounded-xl p-4 animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
            <h3 className="text-xs font-semibold mb-3 uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Bot className="h-3.5 w-3.5 text-primary" /> Agent Activity
            </h3>
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {agentLogs.length > 0 ? (
                agentLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-secondary/30 text-xs">
                    <span className={`shrink-0 mt-0.5 h-1.5 w-1.5 rounded-full ${log.type === "success" ? "bg-neon-green" :
                      log.type === "error" ? "bg-destructive" :
                        "bg-primary"
                      }`} />
                    <div className="min-w-0">
                      <p className="text-foreground leading-snug">{log.message}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{log.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No activity yet. Start composing or sending emails.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailAutomation;
