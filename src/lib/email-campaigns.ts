import { supabase } from "@/integrations/supabase/client";

export type EmailCampaign = {
  id: string;
  subject_template: string;
  body_template: string;
  event_name: string;
  status: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  updated_at: string;
};

export type EmailLog = {
  id: string;
  campaign_id: string;
  participant_id: string;
  participant_name: string;
  participant_email: string | null;
  personalized_subject: string | null;
  personalized_body: string | null;
  status: string;
  sent_at: string | null;
  created_at: string;
};

export async function fetchCampaigns(): Promise<EmailCampaign[]> {
  const { data, error } = await supabase
    .from("email_campaigns")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as EmailCampaign[];
}

export async function createCampaign(campaign: {
  subject_template: string;
  body_template: string;
  event_name: string;
}): Promise<EmailCampaign> {
  const { data, error } = await supabase
    .from("email_campaigns")
    .insert(campaign)
    .select()
    .single();
  if (error) throw error;
  return data as EmailCampaign;
}

export async function updateCampaignStatus(id: string, status: string, counts?: { total_recipients?: number; sent_count?: number; failed_count?: number }) {
  const { error } = await supabase
    .from("email_campaigns")
    .update({ status, ...counts })
    .eq("id", id);
  if (error) throw error;
}

export async function fetchEmailLogs(campaignId: string): Promise<EmailLog[]> {
  const { data, error } = await supabase
    .from("email_logs")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as EmailLog[];
}

export async function insertEmailLogs(logs: Omit<EmailLog, "id" | "created_at">[]) {
  const { error } = await supabase.from("email_logs").insert(logs);
  if (error) throw error;
}

export async function updateEmailLogStatus(id: string, status: string) {
  const updates: any = { status };
  if (status === "sent") updates.sent_at = new Date().toISOString();
  const { error } = await supabase.from("email_logs").update(updates).eq("id", id);
  if (error) throw error;
}

export async function personalizeEmails(
  subjectTemplate: string,
  bodyTemplate: string,
  participants: any[],
  eventName: string
) {
  // We call our local Python backend instead of Supabase Edge Functions
  const response = await fetch("http://localhost:8000/api/preview-emails", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventName,
      subjectTemplate,
      bodyTemplate,
      participants
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to generate previews");
  }

  const data = await response.json();
  // Map Python response to expected frontend format
  return data.map((p: any) => ({
    participant_name: p.name,
    participant_email: p.email,
    personalized_subject: p.subject,
    personalized_body: p.body,
  }));
}

export async function sendBulkEmails(
  subjectTemplate: string,
  bodyTemplate: string,
  participants: any[],
  eventName: string
) {
  const response = await fetch("http://localhost:8000/api/send-bulk-emails", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventName,
      subjectTemplate,
      bodyTemplate,
      participants
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to send bulk emails");
  }

  return await response.json();
}

export async function fetchAgentEmailLogs() {
  const response = await fetch("http://localhost:8000/api/email-logs");
  if (!response.ok) throw new Error("Failed to fetch email logs");
  return await response.json();
}
