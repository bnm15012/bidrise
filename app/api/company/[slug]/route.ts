import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import mysql from "mysql2/promise";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    await ensureSchema();
    const db = getPool();

    const slug = decodeURIComponent(params.slug).toLowerCase();

    const [companies] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT id, name, logo, description, total_bid, created_at
       FROM companies WHERE LOWER(REPLACE(name, ' ', '-')) = ? LIMIT 1`,
      [slug]
    );

    if (!companies[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const company = companies[0];

    const [bids] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT bidder_name, amount, created_at FROM bids
       WHERE company_id = ? AND status = 'paid'
       ORDER BY created_at DESC LIMIT 20`,
      [company.id]
    );

    const [rank] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT COUNT(*) + 1 as rank FROM companies WHERE total_bid > ?`,
      [company.total_bid]
    );

    return NextResponse.json({ company, bids, rank: rank[0].rank });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
