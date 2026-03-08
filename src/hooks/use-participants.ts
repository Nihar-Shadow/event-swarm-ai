import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchParticipants,
  insertParticipants,
  updateParticipant,
  deleteParticipants,
  getDistinctTeams,
  getDistinctColleges,
  getDistinctSegments,
  type ParticipantInsert,
} from "@/lib/participants";
import { toast } from "@/hooks/use-toast";

export function useParticipants() {
  return useQuery({
    queryKey: ["participants"],
    queryFn: fetchParticipants,
  });
}

export function useDistinctTeams() {
  return useQuery({ queryKey: ["participants", "teams"], queryFn: getDistinctTeams });
}

export function useDistinctColleges() {
  return useQuery({ queryKey: ["participants", "colleges"], queryFn: getDistinctColleges });
}

export function useDistinctSegments() {
  return useQuery({ queryKey: ["participants", "segments"], queryFn: getDistinctSegments });
}

export function useInsertParticipants() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rows: ParticipantInsert[]) => insertParticipants(rows),
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ["participants"] });
      toast({ title: "Import successful", description: `${count} participants imported.` });
    },
    onError: (err: Error) => {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateParticipant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ParticipantInsert> }) =>
      updateParticipant(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["participants"] });
      toast({ title: "Participant updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteParticipants() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteParticipants(ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["participants"] });
      toast({ title: "Participants deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    },
  });
}
