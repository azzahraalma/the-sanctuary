import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

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
