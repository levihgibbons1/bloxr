import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: require('path').resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
if (!supabaseUrl || !supabaseKey) {
  console.error('[Supabase] Missing env vars — SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
}
export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : createClient('http://localhost', 'placeholder');
