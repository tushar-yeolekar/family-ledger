import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

export const runtime = "nodejs";

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  connectionLimit: 1
});

const prisma = new PrismaClient({ adapter });

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json({ error: "Date required" }, { status: 400 });
    }

    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);

    const entries = await prisma.entry.findMany({
      where: {
        entryDate: {
          gte: start,
          lt: end
        }
      }
    });

    const totals: Record<string, number> = {};

    for (const e of entries) {
      totals[e.number] = (totals[e.number] || 0) + e.amount;
    }

    const template = await prisma.templatePosition.findMany({
      orderBy: [
        { section: "asc" },
        { col: "asc" },
        { row: "asc" }
      ]
    });

    const result = template.map(pos => ({
      id: pos.id,
      section: pos.section,
      col: pos.col,
      row: pos.row,
      number: pos.number,
      total: totals[pos.number] || 0
    }));

    return NextResponse.json({
      meta: { date },
      template: result
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Output failed" }, { status: 500 });
  }
}