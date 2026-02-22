import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: require('path').resolve(__dirname, '../../.env') });

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(url, key);
