import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import mysql from "mysql2/promise";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ results: [] });

  try {
    await ensureSchema();
    const db = getPool();
    const [rows] = await db.execute<mysql.RowDataPacket[]>(
      `SELECT id, name, logo, description, total_bid
       FROM companies
       WHERE name LIKE ? OR description LIKE ?
       ORDER BY total_bid DESC
       LIMIT 8`,
      [`%${q}%`, `%${q}%`]
    );
    return NextResponse.json({ results: rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
