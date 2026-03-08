import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }),
});

function dayName(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
  const dt = new Date(`${date}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString(undefined, { weekday: "long" });
}

type MergedCell = {
  section: "top" | "bottom";
  col: string;
  row: number;
  number: string;
  total: number;
};

function buildSection(
  merged: MergedCell[],
  section: "top" | "bottom",
  cols: string[]
) {
  const byCol = new Map<string, { number: string; total: number; row: number }[]>();
  for (const c of cols) byCol.set(c, []);

  for (const r of merged.filter((m) => m.section === section)) {
    if (byCol.has(r.col)) byCol.get(r.col)!.push({ number: r.number, total: r.total, row: r.row });
  }
  for (const c of cols) byCol.get(c)!.sort((a, b) => a.row - b.row);
  return byCol;
}

function drawBox(page: any, x: number, y: number, w: number, h: number) {
  page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    color: rgb(1, 1, 1),          // white fill
    borderColor: rgb(0, 0, 0),    // black border
    borderWidth: 0.7,
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = (url.searchParams.get("date") ?? "").trim(); // YYYY-MM-DD
  const bazar = (url.searchParams.get("bazar") ?? "").trim();

  // Template layout (fixed)
  const template = await prisma.templatePosition.findMany({
    orderBy: [{ section: "asc" }, { col: "asc" }, { row: "asc" }],
  });

  // number -> familyId
  const nums = await prisma.number.findMany({ select: { number: true, familyId: true } });
  const numberToFamily = new Map(nums.map((n) => [n.number, n.familyId]));

  // filters
  const where: any = {};
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59.999`);
    where.entryDate = { gte: start, lte: end };
  }
  if (bazar) where.bazar = bazar;

  // totals by family for selected date+bazar
  const familyTotalsRaw = await prisma.entry.groupBy({
    by: ["familyId"],
    where,
    _sum: { amount: true },
  });

  const familyTotals = new Map<number, number>();
  for (const t of familyTotalsRaw) familyTotals.set(t.familyId, t._sum.amount ?? 0);

  const merged: MergedCell[] = template.map((p) => {
    const fam = numberToFamily.get(p.number);
    const total = fam ? familyTotals.get(fam) ?? 0 : 0;
    return {
      section: p.section as "top" | "bottom",
      col: p.col,
      row: p.row,
      number: p.number,
      total,
    };
  });

  const topCols = ["1", "2", "3", "4", "5"];
  const bottomCols = ["6", "7", "8", "9", "0"];

  const top = buildSection(merged, "top", topCols);
  const bottom = buildSection(merged, "bottom", bottomCols);

  const topRows = Math.max(...topCols.map((c) => top.get(c)?.length ?? 0), 0);
  const bottomRows = Math.max(...bottomCols.map((c) => bottom.get(c)?.length ?? 0), 0);

  // --- ONE PAGE sizing ---
  // Try A4 first. If too cramped (row height too small), switch to A3.
  const A4: [number, number] = [595.28, 841.89];
  const A3: [number, number] = [841.89, 1190.55]; // A3 portrait

  const margin = 24;

  function computeRowHeight(pageSize: [number, number]) {
    const [, height] = pageSize;

    // vertical overhead:
    // Title + header line + separator + section titles + column headers + spacing
    const headerBlock = 16 + 22 + 12 + 10; // approx
    const sectionTitle = 14;
    const colHeader = 16;
    const gapBetween = 10;

    const fixed =
      headerBlock +
      sectionTitle + colHeader +
      gapBetween +
      sectionTitle + colHeader;

    const available = height - margin * 2 - fixed;

    // total data rows = max(topRows, bottomRows) but we print both grids separately,
    // so total data rows = topRows + bottomRows
    const totalDataRows = topRows + bottomRows;

    if (totalDataRows <= 0) return 12;

    return Math.floor(available / totalDataRows);
  }

  let pageSize: [number, number] = A4;
  let rowH = computeRowHeight(pageSize);

  // Minimum readable row height. If below this, switch to A3 for readability.
  if (rowH < 9) {
    pageSize = A3;
    rowH = computeRowHeight(pageSize);
  }

  // Clamp row height so it never becomes absurdly small/large
  rowH = Math.max(7, Math.min(rowH, 14));

  // Font sizes based on row height
  const numFont = Math.max(6, Math.min(9, rowH - 2));
  const headerFont = 10;
  const titleFont = 14;

  // --- PDF drawing ---
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const page = pdfDoc.addPage(pageSize);
  const { width, height } = page.getSize();

  let y = height - margin;

  // Title
  page.drawText("Output Sheet", { x: margin, y, size: titleFont, font });
  y -= 18;

  // Meta line
  const meta = `Date: ${date || "-"}   Day: ${date ? dayName(date) : "-"}   Bazar: ${bazar || "-"}`;
  page.drawText(meta, { x: margin, y, size: headerFont, font });
  y -= 12;

  // Separator
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: rgb(0, 0, 0),
  });
  y -= 10;

  function drawGridOneSection(title: string, cols: string[], byCol: Map<string, any[]>, rows: number) {
    page.drawText(title, { x: margin, y, size: 11, font });
    y -= 12;

    const usableWidth = width - margin * 2;
    const colW = usableWidth / cols.length;

    // column headers
    for (let i = 0; i < cols.length; i++) {
      const x = margin + i * colW;
      drawBox(page, x, y - 16, colW, 16);
      page.drawText(cols[i], { x: x + colW / 2 - 3, y: y - 12, size: 9, font });
    }
    y -= 16;

    for (let r = 0; r < rows; r++) {
      for (let i = 0; i < cols.length; i++) {
        const col = cols[i];
        const cell = byCol.get(col)?.[r];

        const x = margin + i * colW;
        const boxY = y - rowH;

        drawBox(page, x, boxY, colW, rowH);

        const num = cell?.number ?? "";
        const tot = cell?.total ? String(cell.total) : "";

        page.drawText(num, { x: x + 3, y: boxY + 2, size: numFont, font });

        const totX = x + colW - 3 - tot.length * (numFont * 0.55);
        page.drawText(tot, { x: Math.max(x + 3, totX), y: boxY + 2, size: numFont, font });
      }
      y -= rowH;
    }

    y -= 8; // gap after section
  }

  drawGridOneSection("Top", topCols, top, topRows);
  drawGridOneSection("Bottom", bottomCols, bottom, bottomRows);

  const pdfBytes = await pdfDoc.save();
  const filename = `output_${date || "all"}_${(bazar || "all").replace(/\s+/g, "_")}.pdf`;

  return new NextResponse(new Uint8Array(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
