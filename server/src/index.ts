import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(process.cwd(), '.env') });
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'loaded' : 'MISSING');
import express from "express";
import cors from "cors";
import syncRouter from "./routes/sync";
import authRouter from "./routes/auth";
import chatRouter from "./routes/chat";
import { requireSession } from "./middleware/auth";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: function(origin, callback) {
    const allowed = [
      'https://www.bloxr.dev',
      'https://bloxr.dev',
      'http://localhost:3000'
    ];
    if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/sync", requireSession, syncRouter);
app.use("/api/chat", requireSession, chatRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
