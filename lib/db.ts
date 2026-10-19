import mysql from "mysql2/promise";

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    const isProd = process.env.MYSQL_SSL === "true";
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || "localhost",
      port: Number(process.env.MYSQL_PORT) || 3306,
      user: process.env.MYSQL_USER || "root",
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE || "bidrise",
      waitForConnections: true,
      connectionLimit: 10,
      timezone: "Z",
      ssl: isProd ? { rejectUnauthorized: false } : undefined,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }
  return pool;
}

async function initSchema() {
  const db = getPool();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS companies (
      id INT NOT NULL AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      logo VARCHAR(100) NOT NULL,
      description TEXT,
      total_bid BIGINT DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_name (name)
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [rows] = await db.execute<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) as c FROM companies"
  );
  if (rows[0].c === 0) {
    const seeds = [
      // 🇮🇳 Well-known Indian startups
      ["Zepto",        "zeptonow.com",      "10-minute grocery delivery across India."],
      ["CRED",         "cred.club",         "Rewards app for people who pay credit cards on time."],
      ["Groww",        "groww.in",          "Simplest way to invest in stocks and mutual funds."],
      ["PhonePe",      "phonepe.com",       "India's most used UPI payments app."],
      ["Meesho",       "meesho.com",        "Social commerce platform empowering small businesses."],
      ["ShareChat",    "sharechat.com",     "India's largest homegrown social media platform."],
      ["Slice",        "sliceit.in",        "Next-gen credit card for millennials."],
      ["Zetwerk",      "zetwerk.com",       "B2B marketplace for manufacturing contracts."],
      ["BrowserStack", "browserstack.com",  "Cloud testing platform used by 50,000+ companies."],
      ["Postman",      "postman.com",       "API platform used by 30 million developers worldwide."],
      ["Khatabook",    "khatabook.com",     "Digital ledger app for 10M+ small business owners."],
      ["Open",         "open.money",        "Business banking and finance OS for SMEs."],
      ["Darwinbox",    "darwinbox.com",     "Cloud HR platform powering 850+ enterprises."],
      // 🇺🇸 US AI startups
      ["Cognition",    "cognition.ai",      "AI software engineer — the one building Devin."],
      ["Perplexity",   "perplexity.ai",     "AI search that actually cites its sources."],
      ["Harvey",       "harvey.ai",         "AI legal assistant disrupting BigLaw quietly."],
      ["Sierra",       "sierra.ai",         "Conversational AI agents for customer experience."],
      ["Runway",       "runwayml.com",      "Gen-AI video tools taking Hollywood by storm."],
      ["ElevenLabs",   "elevenlabs.io",     "Voice cloning so good it's a little scary."],
      ["Razorpay",     "razorpay.com",      "Payment gateway powering 8 million businesses."],
      ["Cashfree",     "cashfree.com",      "Payments and banking infra for internet businesses."],
      ["Mistral",      "mistral.ai",        "Lean, open, fast LLMs built out of Paris."],
      ["Cohere",       "cohere.com",        "Enterprise LLMs for teams that need control."],
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
    `SELECT * FROM companies ORDER BY total_bid DESC, id ASC LIMIT ${limit}`
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
     LIMIT ${limit}`
  );
  return rows as (Bid & { company_name: string })[];
}
