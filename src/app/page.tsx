"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Cell = {
  id: number;
  section: "top" | "bottom";
  col: string;
  row: number;
  number: string;
  total: number;
};

const TOP_COLS = ["1", "2", "3", "4", "5"];
const BOTTOM_COLS = ["6", "7", "8", "9", "0"];

function group(cells: Cell[]) {
  const map = new Map<string, Map<string, Cell[]>>();
  for (const c of cells) {
    if (!map.has(c.section)) map.set(c.section, new Map());
    const sec = map.get(c.section)!;
    if (!sec.has(c.col)) sec.set(c.col, []);
    sec.get(c.col)!.push(c);
  }
  for (const [, cols] of map) {
    for (const [k, arr] of cols) {
      arr.sort((a, b) => a.row - b.row);
      cols.set(k, arr);
    }
  }
  return map;
}

function computeDay(d: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return "";
  const dt = new Date(`${d}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString(undefined, { weekday: "long" });
}

export default function OutputPage() {
  const [cells, setCells] = useState<Cell[]>([]);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [bazar, setBazar] = useState("");
  const [dayName, setDayName] = useState(() => computeDay(new Date().toISOString().slice(0, 10)));

  async function load() {
    setLoading(true);
    const res = await fetch(
      `/api/output?date=${encodeURIComponent(date)}&bazar=${encodeURIComponent(bazar)}`,
      { cache: "no-store" }
    );
    const data = await res.json();
    setCells(data.template ?? []);
    setLoading(false);
  }

  useEffect(() => {
    setDayName(computeDay(date));
  }, [date]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grouped = useMemo(() => group(cells), [cells]);

  const pdfHref = `/api/pdf?date=${encodeURIComponent(date)}&bazar=${encodeURIComponent(bazar)}`;

  return (
    <main style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      <header style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h1 style={{ margin: 0 }}>Output Sheet</h1>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              Date:
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ padding: 6, borderRadius: 8, border: "1px solid #ccc" }}
              />
            </label>

            <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
              Bazar:
              <input
                value={bazar}
                onChange={(e) => setBazar(e.target.value)}
                placeholder="type bazar"
                style={{ padding: 6, borderRadius: 8, border: "1px solid #ccc" }}
              />
            </label>

            <span style={{ color: "#555" }}>
              Day: <b>{dayName || "-"}</b>
            </span>
          </div>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={load}
            style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ccc", cursor: "pointer" }}
          >
            Refresh
          </button>

          <a href={pdfHref} style={{ textDecoration: "underline" }}>
            Download PDF
          </a>

          <Link href="/entry">Add Entry</Link>
        </div>
      </header>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <>
          <SheetSection title="" section="top" cols={TOP_COLS} grouped={grouped} />
          <div style={{ height: 16 }} />
          <SheetSection title="" section="bottom" cols={BOTTOM_COLS} grouped={grouped} />
        </>
      )}
    </main>
  );
}

function SheetSection({
  title,
  section,
  cols,
  grouped,
}: {
  title: string;
  section: "top" | "bottom";
  cols: string[];
  grouped: Map<string, Map<string, Cell[]>>;
}) {
  const colMap = grouped.get(section) ?? new Map<string, Cell[]>();
  const maxRows = Math.max(
    25,
    ...cols.map((c) => (colMap.get(c)?.[colMap.get(c)!.length - 1]?.row ?? 0))
  );

  return (
    <section>
      <h2 style={{ margin: "14px 0 10px" }}>{title}</h2>

      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols.length}, minmax(180px, 1fr))`, gap: 10 }}>
        {cols.map((col) => (
          <div key={col} style={{ border: "1px solid #bbb", borderRadius: 10, overflow: "hidden" }}>
            <div style={{ padding: 10, borderBottom: "1px solid #bbb", fontWeight: 700, textAlign: "center" }}>
              {col}
            </div>
            <div style={{ padding: 8 }}>
              <ColumnRows rows={maxRows} cells={colMap.get(col) ?? []} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ColumnRows({ rows, cells }: { rows: number; cells: Cell[] }) {
  const byRow = new Map<number, Cell>();
  for (const c of cells) byRow.set(c.row, c);

  return (
    <div>
      {Array.from({ length: rows }, (_, i) => i + 1).map((r) => {
        const c = byRow.get(r);
        return (
          <div
            key={r}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "6px 6px",
              borderBottom: "1px solid #eee",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            }}
          >
            <span style={{ minWidth: 48 }}>{c ? c.number : ""}</span>
            <span style={{ minWidth: 48, textAlign: "right" }}>{c ? c.total : ""}</span>
          </div>
        );
      })}
    </div>
  );
}
