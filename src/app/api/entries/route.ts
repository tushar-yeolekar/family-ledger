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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { number, amount, entryDate, bazar } = body;

    if (!number || !amount || !entryDate) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const num = await prisma.number.findUnique({
      where: { number }
    });

    if (!num) {
      return NextResponse.json({ error: "Number not found" }, { status: 404 });
    }

    const entry = await prisma.entry.create({
      data: {
        number,
        familyId: num.familyId,
        amount: Number(amount),
        entryDate: new Date(entryDate),
        bazar: bazar || ""
      }
    });

    return NextResponse.json(entry);

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to save entry" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const entries = await prisma.entry.findMany({
      orderBy: { createdAt: "desc" },
      take: 20
    });

    return NextResponse.json(entries);

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to load entries" }, { status: 500 });
  }
}