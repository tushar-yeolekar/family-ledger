import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

export const runtime = "nodejs";

const adapter = new PrismaMariaDb({
  host: "localhost",
  port: 3306,
  user: "u348781095_familyuser",
  password: process.env.DB_PASSWORD!,
  database: "u348781095_familyledger",
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

function normalizeNumber(n: string) {
  const s = (n ?? "").trim();
  if (!/^\d{1,3}$/.test(s)) return null;
  return s.padStart(3, "0");
}

function parseDateOnly(d: string) {
  const s = (d ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const dt = new Date(`${s}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const number = normalizeNumber(body?.number);
  const amount = Number(body?.amount);
  const bazar = String(body?.bazar ?? "").trim();
  const entryDate = parseDateOnly(String(body?.date ?? ""));

  if (!number) {
    return NextResponse.json({ error: "Invalid number" }, { status: 400 });
  }
  if (!Number.isInteger(amount)) {
    return NextResponse.json({ error: "Amount must be an integer" }, { status: 400 });
  }
  if (!bazar) {
    return NextResponse.json({ error: "Bazar is required" }, { status: 400 });
  }
  if (!entryDate) {
    return NextResponse.json({ error: "Date must be YYYY-MM-DD" }, { status: 400 });
  }

  const numRow = await prisma.number.findUnique({
    where: { number },
    select: { number: true, familyId: true },
  });

  if (!numRow) {
    return NextResponse.json({ error: "Number not found in input sheet" }, { status: 400 });
  }

  const entry = await prisma.entry.create({
    data: {
      number: numRow.number,
      familyId: numRow.familyId,
      amount,
      entryDate,
      bazar,
    },
  });

  return NextResponse.json({ ok: true, entry });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  const bazar = (url.searchParams.get("bazar") ?? "").trim();

  const where: any = {};

  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59.999`);
    where.entryDate = { gte: start, lte: end };
  }

  if (bazar) where.bazar = bazar;

  const last = await prisma.entry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json({ last });
}