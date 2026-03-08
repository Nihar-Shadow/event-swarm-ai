import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Participant = Tables<"participants">;
export type ParticipantInsert = {
  name: string;
  email?: string | null;
  team_name?: string | null;
  college?: string | null;
  phone?: string | null;
  segment?: string | null;
  notes?: string | null;
};

export async function fetchParticipants() {
  const { data, error } = await supabase
    .from("participants")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function insertParticipants(rows: ParticipantInsert[]) {
  // Insert in batches of 500
  const batchSize = 500;
  let total = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from("participants").insert(batch);
    if (error) throw error;
    total += batch.length;
  }
  return total;
}

export async function updateParticipant(id: string, updates: Partial<ParticipantInsert>) {
  const { error } = await supabase.from("participants").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteParticipants(ids: string[]) {
  const { error } = await supabase.from("participants").delete().in("id", ids);
  if (error) throw error;
}

export async function getDistinctTeams(): Promise<string[]> {
  const { data, error } = await supabase
    .from("participants")
    .select("team_name")
    .not("team_name", "is", null)
    .order("team_name");
  if (error) throw error;
  const unique = [...new Set(data?.map((d) => d.team_name).filter(Boolean) as string[])];
  return unique;
}

export async function getDistinctColleges(): Promise<string[]> {
  const { data, error } = await supabase
    .from("participants")
    .select("college")
    .not("college", "is", null)
    .order("college");
  if (error) throw error;
  const unique = [...new Set(data?.map((d) => d.college).filter(Boolean) as string[])];
  return unique;
}

export async function getDistinctSegments(): Promise<string[]> {
  const { data, error } = await supabase
    .from("participants")
    .select("segment")
    .not("segment", "is", null)
    .order("segment");
  if (error) throw error;
  const unique = [...new Set(data?.map((d) => d.segment).filter(Boolean) as string[])];
  return unique;
}
