import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// PostgreSQL pool (only connects when DATABASE_URL is set)
const pool = process.env.DATABASE_URL
  ? new pg.Pool({ connectionString: process.env.DATABASE_URL })
  : null;

// Ensure waitlist table exists
async function ensureSchema() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS waitlist (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}
ensureSchema().catch(console.error);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/waitlist", async (_req, res) => {
  if (!pool) {
    res.json({ count: 0 });
    return;
  }
  try {
    const result = await pool.query("SELECT COUNT(*) FROM waitlist");
    res.json({ count: parseInt(result.rows[0].count, 10) });
  } catch {
    res.json({ count: 0 });
  }
});

app.post("/api/waitlist", async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email || !email.includes("@") || !email.includes(".")) {
    res.status(400).json({ error: "Please enter a valid email address." });
    return;
  }
  if (!pool) {
    // No DB configured — still accept in dev
    res.json({ success: true });
    return;
  }
  try {
    await pool.query(
      "INSERT INTO waitlist (email) VALUES ($1) ON CONFLICT (email) DO NOTHING",
      [email.toLowerCase().trim()]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Waitlist error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
