import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    const ssl = process.env.MYSQL_SSL === "true" ? { rejectUnauthorized: true } : undefined;
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || "localhost",
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE || "bidrise",
      waitForConnections: true,
      connectionLimit: 10,
      timezone: "Z",
      ssl,
    });
  }
  return pool;
}

async function initSchema() {
  const db = getPool();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS companies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      logo VARCHAR(100) NOT NULL,
      description TEXT,
      total_bid BIGINT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS bids (
      id INT AUTO_INCREMENT PRIMARY KEY,
      company_id INT NOT NULL,
      bidder_name VARCHAR(255) NOT NULL,
      bidder_email VARCHAR(255) NOT NULL,
      amount BIGINT NOT NULL,
      razorpay_order_id VARCHAR(255),
      razorpay_payment_id VARCHAR(255),
      status ENUM('pending','paid','failed') DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id)
    )
  `);

  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) as c FROM companies"
  );
  if (rows[0].c === 0) {
    const seeds = [
      // 🇮🇳 Indian early-stage startups
      ["Progcap",    "progcap.com",       "Credit access for the last-mile retailer."],
      ["Niro",       "niro.co",           "Embedded credit for apps your users already use."],
      ["Hissa",      "hissa.com",         "Cap table & ESOP management for early startups."],
      ["Reelo",      "reelo.io",          "Loyalty & marketing OS for local businesses."],
      ["Junio",      "junio.in",          "Smart money app built for Indian kids & teens."],
      ["Vokal",      "vokal.in",          "Vernacular knowledge platform for Bharat."],
      ["Jar",        "myjar.app",         "Save in digital gold with every UPI spend."],
      ["Vahan",      "vahan.co",          "AI recruiter for India's blue-collar workforce."],
      ["SuperK",     "superk.in",         "Franchise kirana stores for rural India."],
      ["Fampay",     "fampay.in",         "Banking & card for teens before they turn 18."],
      ["Recko",      "recko.io",          "Payments reconciliation for high-volume businesses."],
      // 🇺🇸 US AI early-stage startups
      ["Cognition",  "cognition.ai",      "AI software engineer — the one building Devin."],
      ["Perplexity", "perplexity.ai",     "AI search that actually cites its sources."],
      ["Harvey",     "harvey.ai",         "AI legal assistant disrupting BigLaw quietly."],
      ["Sierra",     "sierra.ai",         "Conversational AI agents for customer experience."],
      ["Runway",     "runwayml.com",      "Gen-AI video tools taking Hollywood by storm."],
      ["ElevenLabs", "elevenlabs.io",     "Voice cloning so good it's a little scary."],
      ["Imbue",      "imbue.com",         "Training AI agents that can actually reason."],
      ["Cohere",     "cohere.com",        "Enterprise LLMs for teams that need control."],
      ["Mistral",    "mistral.ai",        "Lean, open, fast LLMs built out of Paris."],
      ["Pika",       "pika.art",          "Text-to-video AI that everyone on TikTok uses."],
      ["Adept",      "adept.ai",          "AI that controls your computer so you don't have to."],
      ["Hebbia",     "hebbia.ai",         "AI for document-heavy industries like finance & law."],
    ];
    for (const [name, logo, description] of seeds) {
      await db.execute(
        "INSERT INTO companies (name, logo, description) VALUES (?, ?, ?)",
        [name, logo, description]
      );
    }
  }
}

let schemaReady: Promise<void> | null = null;

export async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = initSchema().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

export type Company = {
  id: number;
  name: string;
  logo: string;
  description: string;
  total_bid: number;
  created_at: string;
};

export type Bid = {
  id: number;
  company_id: number;
  bidder_name: string;
  bidder_email: string;
  amount: number;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  status: string;
  created_at: string;
};

export async function getRankings(limit = 7): Promise<Company[]> {
  await ensureSchema();
  const db = getPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT * FROM companies ORDER BY total_bid DESC, id ASC LIMIT ?",
    [limit]
  );
  return rows as Company[];
}

export async function getCompanyById(id: number): Promise<Company | undefined> {
  await ensureSchema();
  const db = getPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT * FROM companies WHERE id = ?",
    [id]
  );
  return rows[0] as Company | undefined;
}

export async function createBid(data: {
  company_id: number;
  bidder_name: string;
  bidder_email: string;
  amount: number;
  razorpay_order_id: string;
}): Promise<number> {
  await ensureSchema();
  const db = getPool();
  const [result] = await db.execute<mysql.ResultSetHeader>(
    "INSERT INTO bids (company_id, bidder_name, bidder_email, amount, razorpay_order_id, status) VALUES (?, ?, ?, ?, ?, 'pending')",
    [
      data.company_id,
      data.bidder_name,
      data.bidder_email,
      data.amount,
      data.razorpay_order_id,
    ]
  );
  return result.insertId;
}

export async function confirmBid(
  razorpay_order_id: string,
  razorpay_payment_id: string
): Promise<boolean> {
  await ensureSchema();
  const db = getPool();
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute<mysql.RowDataPacket[]>(
      "SELECT * FROM bids WHERE razorpay_order_id = ? AND status = 'pending'",
      [razorpay_order_id]
    );
    const bid = rows[0] as Bid | undefined;
    if (!bid) {
      await conn.rollback();
      return false;
    }

    await conn.execute(
      "UPDATE bids SET status = 'paid', razorpay_payment_id = ? WHERE razorpay_order_id = ?",
      [razorpay_payment_id, razorpay_order_id]
    );
    await conn.execute(
      "UPDATE companies SET total_bid = total_bid + ? WHERE id = ?",
      [bid.amount, bid.company_id]
    );

    await conn.commit();
    return true;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function getRecentBids(
  limit = 10
): Promise<(Bid & { company_name: string })[]> {
  await ensureSchema();
  const db = getPool();
  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    `SELECT b.*, c.name as company_name
     FROM bids b JOIN companies c ON b.company_id = c.id
     WHERE b.status = 'paid'
     ORDER BY b.created_at DESC
     LIMIT ?`,
    [limit]
  );
  return rows as (Bid & { company_name: string })[];
}
