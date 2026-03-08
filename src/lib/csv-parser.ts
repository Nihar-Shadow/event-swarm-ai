import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { ParticipantInsert } from "./participants";

const FIELD_MAP: Record<string, keyof ParticipantInsert> = {
  name: "name",
  "full name": "name",
  "participant name": "name",
  email: "email",
  "email address": "email",
  "e-mail": "email",
  team: "team_name",
  "team name": "team_name",
  "team_name": "team_name",
  college: "college",
  university: "college",
  institution: "college",
  school: "college",
  phone: "phone",
  "phone number": "phone",
  mobile: "phone",
  contact: "phone",
  segment: "segment",
  group: "segment",
  category: "segment",
};

function mapHeaders(rawHeaders: string[]): Record<number, keyof ParticipantInsert> {
  const mapping: Record<number, keyof ParticipantInsert> = {};
  rawHeaders.forEach((h, i) => {
    const key = h.trim().toLowerCase();
    if (FIELD_MAP[key]) {
      mapping[i] = FIELD_MAP[key];
    }
  });
  return mapping;
}

function rowsToParticipants(
  rows: string[][],
  headerMap: Record<number, keyof ParticipantInsert>
): ParticipantInsert[] {
  return rows
    .map((row) => {
      const p: Record<string, string | null> = {};
      Object.entries(headerMap).forEach(([idx, field]) => {
        const val = row[Number(idx)]?.trim();
        p[field] = val || null;
      });
      return p as unknown as ParticipantInsert;
    })
    .filter((p) => p.name && p.name.trim().length > 0);
}

export function parseCSV(file: File): Promise<ParticipantInsert[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (results) => {
        const allRows = results.data as string[][];
        if (allRows.length < 2) {
          reject(new Error("File has no data rows"));
          return;
        }
        const headerMap = mapHeaders(allRows[0]);
        if (!Object.values(headerMap).includes("name")) {
          reject(new Error("Could not find a 'Name' column. Please include a Name header."));
          return;
        }
        const participants = rowsToParticipants(allRows.slice(1), headerMap);
        resolve(participants);
      },
      error: (err) => reject(err),
    });
  });
}

export function parseExcel(file: File): Promise<ParticipantInsert[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (rows.length < 2) {
          reject(new Error("File has no data rows"));
          return;
        }
        const headerMap = mapHeaders(rows[0]);
        if (!Object.values(headerMap).includes("name")) {
          reject(new Error("Could not find a 'Name' column. Please include a Name header."));
          return;
        }
        const participants = rowsToParticipants(rows.slice(1), headerMap);
        resolve(participants);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
