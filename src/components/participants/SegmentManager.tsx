import { useState } from "react";
import { Tag, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface Props {
  selectedIds: string[];
  onDone: () => void;
}

export function SegmentManager({ selectedIds, onDone }: Props) {
  const [segment, setSegment] = useState("");
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const apply = async () => {
    if (!segment.trim() || selectedIds.length === 0) return;
    setLoading(true);
    const { error } = await supabase
      .from("participants")
      .update({ segment: segment.trim() })
      .in("id", selectedIds);
    setLoading(false);
    if (error) {
      toast({ title: "Failed to assign segment", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Segment assigned", description: `Applied "${segment.trim()}" to ${selectedIds.length} participants` });
      qc.invalidateQueries({ queryKey: ["participants"] });
      onDone();
    }
  };

  return (
    <div className="flex items-center gap-2 animate-fade-in">
      <Tag className="h-3.5 w-3.5 text-primary shrink-0" />
      <input
        value={segment}
        onChange={(e) => setSegment(e.target.value)}
        placeholder="Segment name..."
        className="px-3 py-1.5 rounded-lg bg-secondary/80 border border-border/50 text-xs focus:outline-none focus:ring-1 focus:ring-primary w-40"
      />
      <button
        onClick={apply}
        disabled={loading || !segment.trim()}
        className="text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1"
      >
        <Plus className="h-3 w-3" /> Assign
      </button>
      <button onClick={onDone} className="p-1 rounded-md hover:bg-secondary transition-colors">
        <X className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}
