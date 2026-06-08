/**
 * Jalankan: npm run seed
 * Butuh VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../../.env");

try {
  const env = readFileSync(envPath, "utf8");
  env.split("\n").forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  });
} catch {
  console.warn("File .env tidak ditemukan — pastikan env Supabase sudah diset.");
}

const { seedAll } = await import("./seedSupabase.js");
seedAll().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
