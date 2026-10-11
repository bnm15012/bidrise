import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import mysql from "mysql2/promise";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, domain, description } = body;

    if (!name?.trim() || !domain?.trim() || !description?.trim()) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    await ensureSchema();
    const db = getPool();

    const [existing] = await db.execute<mysql.RowDataPacket[]>(
      "SELECT id FROM companies WHERE name = ?",
      [name.trim()]
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: "A company with that name already exists" }, { status: 409 });
    }

    await db.execute(
      "INSERT INTO companies (name, logo, description) VALUES (?, ?, ?)",
      [name.trim(), domain.trim().toLowerCase(), description.trim()]
    );

    // Fetch the inserted row by name (TiDB serverless sometimes returns insertId=0)
    const [inserted] = await db.execute<mysql.RowDataPacket[]>(
      "SELECT * FROM companies WHERE name = ?",
      [name.trim()]
    );
    const company = inserted[0];

    return NextResponse.json({ id: company.id, name: company.name, logo: company.logo, description: company.description, total_bid: 0 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to add company" }, { status: 500 });
  }
}
