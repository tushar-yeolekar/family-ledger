import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PDFDocument, StandardFonts } from "pdf-lib";

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

    const start = new Date(date!);
    const end = new Date(date!);
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

    const pdf = await PDFDocument.create();
    const page = pdf.addPage([600, 800]);

    const font = await pdf.embedFont(StandardFonts.Helvetica);

    page.drawText(`Ledger Output ${date}`, {
      x: 50,
      y: 750,
      size: 20,
      font
    });

    let y = 700;

    for (const number in totals) {
      page.drawText(`${number} : ${totals[number]}`, {
        x: 50,
        y,
        size: 12,
        font
      });
      y -= 20;
    }

    const bytes = await pdf.save();

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/pdf"
      }
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "PDF failed" }, { status: 500 });
  }
}