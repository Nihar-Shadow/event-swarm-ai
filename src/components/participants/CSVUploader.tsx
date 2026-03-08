import { useCallback, useRef, useState } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { parseCSV, parseExcel } from "@/lib/csv-parser";
import { useInsertParticipants } from "@/hooks/use-participants";
import type { ParticipantInsert } from "@/lib/participants";

export function CSVUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ParticipantInsert[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const insertMutation = useInsertParticipants();

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setPreview(null);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      let rows: ParticipantInsert[];
      if (ext === "csv" || ext === "txt") {
        rows = await parseCSV(file);
      } else if (ext === "xlsx" || ext === "xls") {
        rows = await parseExcel(file);
      } else {
        setError("Unsupported file type. Please upload a CSV or Excel file.");
        return;
      }
      if (rows.length === 0) {
        setError("No valid participant rows found. Make sure there's a 'Name' column.");
        return;
      }
      setPreview(rows);
    } catch (err: any) {
      setError(err.message || "Failed to parse file");
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
    [handleFile]
  );

  const confirmImport = () => {
    if (!preview) return;
    insertMutation.mutate(preview, {
      onSuccess: () => setPreview(null),
    });
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`glass-card rounded-xl p-8 border-2 border-dashed cursor-pointer transition-all text-center ${
          dragOver ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/40"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.txt"
          onChange={onFileChange}
          className="hidden"
        />
        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium">Drop a CSV or Excel file here</p>
        <p className="text-xs text-muted-foreground mt-1">
          or click to browse · Supports .csv, .xlsx, .xls
        </p>
        <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><FileSpreadsheet className="h-3 w-3" /> Name</span>
          <span>Email</span>
          <span>Team Name</span>
          <span>College</span>
          <span>Phone</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="glass-card rounded-xl p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-neon-green" />
              <span className="text-sm font-semibold">{preview.length} participants ready to import</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreview(null)}
                className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmImport}
                disabled={insertMutation.isPending}
                className="text-xs font-medium bg-primary text-primary-foreground px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {insertMutation.isPending ? "Importing..." : "Confirm Import"}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-2 text-muted-foreground font-medium">Name</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Email</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Team</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">College</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Phone</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 20).map((p, i) => (
                  <tr key={i} className="border-b border-border/20">
                    <td className="p-2">{p.name}</td>
                    <td className="p-2 text-muted-foreground font-mono">{p.email || "—"}</td>
                    <td className="p-2 text-muted-foreground">{p.team_name || "—"}</td>
                    <td className="p-2 text-muted-foreground">{p.college || "—"}</td>
                    <td className="p-2 text-muted-foreground font-mono">{p.phone || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 20 && (
              <p className="text-[10px] text-muted-foreground text-center p-2">
                Showing 20 of {preview.length} rows
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
