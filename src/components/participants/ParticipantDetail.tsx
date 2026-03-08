import { useState } from "react";
import { X, Save } from "lucide-react";
import type { Participant } from "@/lib/participants";
import { useUpdateParticipant } from "@/hooks/use-participants";

interface Props {
  participant: Participant;
  onClose: () => void;
}

export function ParticipantDetail({ participant, onClose }: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: participant.name,
    email: participant.email || "",
    team_name: participant.team_name || "",
    college: participant.college || "",
    phone: participant.phone || "",
    segment: participant.segment || "",
    notes: participant.notes || "",
  });
  const updateMutation = useUpdateParticipant();

  const handleSave = () => {
    updateMutation.mutate(
      {
        id: participant.id,
        updates: {
          name: form.name,
          email: form.email || null,
          team_name: form.team_name || null,
          college: form.college || null,
          phone: form.phone || null,
          segment: form.segment || null,
          notes: form.notes || null,
        },
      },
      { onSuccess: () => { setEditing(false); onClose(); } }
    );
  };

  const fields = [
    { label: "Name", key: "name" as const, mono: false },
    { label: "Email", key: "email" as const, mono: true },
    { label: "Team", key: "team_name" as const, mono: false },
    { label: "College", key: "college" as const, mono: false },
    { label: "Phone", key: "phone" as const, mono: true },
    { label: "Segment", key: "segment" as const, mono: false },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-card rounded-xl p-6 w-full max-w-lg mx-4 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Participant Details</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="text-[10px] text-muted-foreground uppercase tracking-wider">{f.label}</label>
              {editing ? (
                <input
                  value={form[f.key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary/80 border border-border/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              ) : (
                <p className={`text-sm mt-0.5 ${f.mono ? "font-mono" : ""} ${!form[f.key] ? "text-muted-foreground" : ""}`}>
                  {form[f.key] || "—"}
                </p>
              )}
            </div>
          ))}

          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Notes</label>
            {editing ? (
              <textarea
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full mt-1 px-3 py-2 rounded-lg bg-secondary/80 border border-border/50 text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            ) : (
              <p className={`text-sm mt-0.5 ${!form.notes ? "text-muted-foreground" : ""}`}>
                {form.notes || "—"}
              </p>
            )}
          </div>

          <div className="text-[10px] text-muted-foreground font-mono pt-2">
            ID: {participant.id} · Created: {new Date(participant.created_at).toLocaleDateString()}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-5">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="text-xs px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="text-xs font-medium bg-primary text-primary-foreground px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
              >
                <Save className="h-3 w-3" /> Save
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-xs font-medium bg-primary text-primary-foreground px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
