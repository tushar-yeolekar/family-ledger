import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  const bazar = (url.searchParams.get("bazar") ?? "").trim();

  const template = await prisma.templatePosition.findMany({
    orderBy: [{ section: "asc" }, { col: "asc" }, { row: "asc" }],
  });

  const nums = await prisma.number.findMany({
    select: { number: true, familyId: true },
  });
  const numberToFamily = new Map(nums.map((n) => [n.number, n.familyId]));

  const where: any = {};
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59.999`);
    where.entryDate = { gte: start, lte: end };
  }
  if (bazar) where.bazar = bazar;

  const familyTotalsRaw = await prisma.entry.groupBy({
    by: ["familyId"],
    where,
    _sum: { amount: true },
  });

  const familyTotals = new Map<number, number>();
  for (const t of familyTotalsRaw) {
    familyTotals.set(t.familyId, t._sum.amount ?? 0);
  }

  const merged = template.map((p) => {
    const familyId = numberToFamily.get(p.number);
    const total = familyId ? (familyTotals.get(familyId) ?? 0) : 0;
    return { ...p, total };
  });

  return NextResponse.json({
    meta: { date: date ?? "", bazar },
    template: merged,
  });
}