import { useState, useMemo } from "react";
import {
  Users, Search, Upload as UploadIcon, Download, Trash2, Tag, ChevronDown, Eye, Loader2,
} from "lucide-react";
import { useParticipants, useDistinctTeams, useDistinctColleges, useDistinctSegments, useDeleteParticipants } from "@/hooks/use-participants";
import { CSVUploader } from "@/components/participants/CSVUploader";
import { ParticipantDetail } from "@/components/participants/ParticipantDetail";
import { SegmentManager } from "@/components/participants/SegmentManager";
import { exportToCSV } from "@/lib/csv-parser";
import type { Participant } from "@/lib/participants";

const Participants = () => {
  const { data: participants = [], isLoading } = useParticipants();
  const { data: teams = [] } = useDistinctTeams();
  const { data: colleges = [] } = useDistinctColleges();
  const { data: segments = [] } = useDistinctSegments();
  const deleteMutation = useDeleteParticipants();

  const [search, setSearch] = useState("");
  const [filterTeam, setFilterTeam] = useState("");
  const [filterCollege, setFilterCollege] = useState("");
  const [filterSegment, setFilterSegment] = useState("");
  const [showUploader, setShowUploader] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<Participant | null>(null);
  const [showSegmentTool, setShowSegmentTool] = useState(false);

  const filtered = useMemo(() => {
    let list = participants;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.team_name?.toLowerCase().includes(q) ||
          p.college?.toLowerCase().includes(q) ||
          p.phone?.includes(q)
      );
    }
    if (filterTeam) list = list.filter((p) => p.team_name === filterTeam);
    if (filterCollege) list = list.filter((p) => p.college === filterCollege);
    if (filterSegment) list = list.filter((p) => p.segment === filterSegment);
    return list;
  }, [participants, search, filterTeam, filterCollege, filterSegment]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  };

  const handleExport = () => {
    const data = (selected.size > 0 ? filtered.filter((p) => selected.has(p.id)) : filtered).map((p) => ({
      Name: p.name,
      Email: p.email || "",
      "Team Name": p.team_name || "",
      College: p.college || "",
      Phone: p.phone || "",
      Segment: p.segment || "",
    }));
    exportToCSV(data, `participants-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleDelete = () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} participant(s)?`)) return;
    deleteMutation.mutate([...selected], { onSuccess: () => setSelected(new Set()) });
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Participants</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {participants.length.toLocaleString()} total · {filtered.length.toLocaleString()} shown
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUploader(!showUploader)}
            className="text-xs font-medium bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5"
          >
            <UploadIcon className="h-3.5 w-3.5" /> Import CSV
          </button>
          <button
            onClick={handleExport}
            className="text-xs font-medium px-4 py-2 rounded-lg border border-border/50 hover:bg-secondary transition-colors flex items-center gap-1.5"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>

      {/* Upload area */}
      {showUploader && (
        <div className="animate-fade-in">
          <CSVUploader />
        </div>
      )}

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="glass-card rounded-lg flex items-center gap-2 px-3 py-2 flex-1 min-w-[200px]">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, team, college, phone..."
            className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
          />
        </div>

        <FilterDropdown label="Team" value={filterTeam} options={teams} onChange={setFilterTeam} />
        <FilterDropdown label="College" value={filterCollege} options={colleges} onChange={setFilterCollege} />
        <FilterDropdown label="Segment" value={filterSegment} options={segments} onChange={setFilterSegment} />
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 glass-card rounded-lg px-4 py-2.5 animate-fade-in">
          <span className="text-xs font-medium">{selected.size} selected</span>
          <div className="h-4 w-px bg-border" />
          {showSegmentTool ? (
            <SegmentManager
              selectedIds={[...selected]}
              onDone={() => { setShowSegmentTool(false); setSelected(new Set()); }}
            />
          ) : (
            <>
              <button
                onClick={() => setShowSegmentTool(true)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <Tag className="h-3 w-3" /> Assign Segment
              </button>
              <button
                onClick={handleDelete}
                className="text-xs text-destructive hover:text-destructive/80 flex items-center gap-1 transition-colors ml-auto"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            </>
          )}
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center animate-fade-in">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">No participants found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {participants.length === 0
              ? "Import a CSV to get started"
              : "Try adjusting your search or filters"}
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      checked={selected.size === filtered.length && filtered.length > 0}
                      onChange={toggleAll}
                      className="rounded border-border accent-primary"
                    />
                  </th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Email</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Team</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">College</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Phone</th>
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Segment</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className={`border-b border-border/20 hover:bg-secondary/30 transition-colors ${
                      selected.has(p.id) ? "bg-primary/5" : ""
                    }`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="rounded border-border accent-primary"
                      />
                    </td>
                    <td className="p-3 font-medium">{p.name}</td>
                    <td className="p-3 text-muted-foreground font-mono text-xs hidden md:table-cell">{p.email || "—"}</td>
                    <td className="p-3 text-muted-foreground text-xs hidden lg:table-cell">{p.team_name || "—"}</td>
                    <td className="p-3 text-muted-foreground text-xs hidden lg:table-cell">{p.college || "—"}</td>
                    <td className="p-3 text-muted-foreground font-mono text-xs hidden sm:table-cell">{p.phone || "—"}</td>
                    <td className="p-3">
                      {p.segment ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neon-cyan/10 text-neon-cyan">
                          {p.segment}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => setDetail(p)}
                        className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {detail && <ParticipantDetail participant={detail} onClose={() => setDetail(null)} />}
    </div>
  );
};

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="glass-card appearance-none rounded-lg text-xs px-3 py-2 pr-7 bg-card border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
      >
        <option value="">All {label}s</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="h-3 w-3 text-muted-foreground absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

export default Participants;
