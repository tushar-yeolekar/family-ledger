"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Entry = {
  id: number;
  number: string;
  familyId: number;
  amount: number;
  bazar: string;
  entryDate: string; // ISO string from API
  createdAt: string;
};

export default function EntryPage() {
  const [number, setNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [bazar, setBazar] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [last, setLast] = useState<Entry[]>([]);
  const [saving, setSaving] = useState(false);

  async function safeJson(res: Response) {
    const text = await res.text().catch(() => "");
    if (!text) return { text: "", json: null as any };
    try {
      return { text, json: JSON.parse(text) };
    } catch {
      return { text, json: null as any };
    }
  }

  async function loadLast() {
    setMsg(null);
    const qs = `?date=${encodeURIComponent(date)}&bazar=${encodeURIComponent(bazar.trim())}`;
    const res = await fetch(`/api/entries${qs}`, { cache: "no-store" });
    const { text, json } = await safeJson(res);

    if (!res.ok) {
      setMsg(json?.error ?? text ?? "Failed to load recent entries");
      return;
    }

    setLast(json?.last ?? []);
  }

  useEffect(() => {
    loadLast();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit() {
    setMsg(null);

    const baz = bazar.trim();
    if (!baz) {
      setMsg("Please enter Bazar");
      return;
    }
    if (!number.trim()) {
      setMsg("Please enter Number");
      return;
    }
    if (!amount.trim()) {
      setMsg("Please enter Amount");
      return;
    }

    setSaving(true);

    const res = await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        number,
        amount: Number(amount),
        date, // YYYY-MM-DD
        bazar: baz,
      }),
    });

    const { text, json } = await safeJson(res);

    if (!res.ok) {
      setMsg(json?.error ?? text ?? "Server error");
      setSaving(false);
      return;
    }

    setMsg("Saved ✅");
    setAmount("");
    setSaving(false);
    await loadLast();
  }

  return (
    <main style={{ padding: 16, maxWidth: 900, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <h1 style={{ margin: 0 }}>Add Entry</h1>
        <div style={{ marginLeft: "auto" }}>
          <Link href="/">Output</Link>
        </div>
      </header>

      <div style={{ marginTop: 14, border: "1px solid #ccc", borderRadius: 12, padding: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label>
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
            />
          </label>

          <label>
            Bazar
            <input
              value={bazar}
              onChange={(e) => setBazar(e.target.value)}
              placeholder="e.g. City Market"
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
            />
          </label>

          <label>
            Family (e.g. 128)
            <input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="128"
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
            />
          </label>

          <label>
            Amount (integer)
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10"
              inputMode="numeric"
              style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
            />
          </label>
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={submit}
            disabled={saving}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #ccc",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>

          <button
            onClick={loadLast}
            style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ccc", cursor: "pointer" }}
          >
            Refresh Recent
          </button>

          {msg ? <span style={{ color: msg.includes("Saved") ? "green" : "crimson" }}>{msg}</span> : null}
        </div>
      </div>

      <h2 style={{ marginTop: 18 }}>Recent entries</h2>
      <div style={{ border: "1px solid #ddd", borderRadius: 12, overflow: "hidden" }}>
        {last.map((e) => (
          <div key={e.id} style={{ padding: 10, borderBottom: "1px solid #eee" }}>
            <b>{e.number}</b> — {e.amount}{" "}
            <span style={{ color: "#666" }}>
              (familyId {e.familyId}, bazar {e.bazar || "-"}, date {e.entryDate ? new Date(e.entryDate).toLocaleDateString() : "-"} —{" "}
              {new Date(e.createdAt).toLocaleString()})
            </span>
          </div>
        ))}
        {last.length === 0 ? <div style={{ padding: 10, color: "#666" }}>No entries yet.</div> : null}
      </div>
    </main>
  );
}
