import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env') });
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'loaded' : 'MISSING');
import express from "express";
import cors from "cors";
import syncRouter from "./routes/sync";
import authRouter from "./routes/auth";
import { requireSession } from "./middleware/auth";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['https://www.bloxr.dev', 'https://bloxr.dev', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/sync", requireSession, syncRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
