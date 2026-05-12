// Script temporaire pour appliquer le schéma directement via PostgreSQL
// Contourne la traduction automatique de l'éditeur SQL Supabase
// Usage: node scripts/apply-schema.mjs <db-password>
// Supprimer ce fichier après usage.

import { readFileSync } from "fs";
import { createConnection } from "net";
import pg from "pg";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const { Client } = pg;

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/apply-schema.mjs <db-password>");
  process.exit(1);
}

const PROJECT_REF = "kqshknfrtlbjaufkdeeg";
const __dir = dirname(fileURLToPath(import.meta.url));

const client = new Client({
  host: `db.${PROJECT_REF}.supabase.co`,
  port: 5432,
  database: "postgres",
  user: "postgres",
  password,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  console.log("Connexion à Supabase...");
  await client.connect();
  console.log("Connecté.");

  const schemaFile = join(__dir, "../supabase/001_schema.sql");
  const seedFile = join(__dir, "../supabase/002_seed.sql");

  console.log("\n=== Suppression des tables existantes ===");
  await client.query(`
    DROP TABLE IF EXISTS property_images CASCADE;
    DROP TABLE IF EXISTS favorites CASCADE;
    DROP TABLE IF EXISTS messages CASCADE;
    DROP TABLE IF EXISTS properties CASCADE;
    DROP TABLE IF EXISTS profiles CASCADE;
    DROP TABLE IF EXISTS site_config CASCADE;
  `);
  console.log("Tables supprimées.");

  console.log("\n=== Application du schéma (001_schema.sql) ===");
  const schema = readFileSync(schemaFile, "utf8");
  await client.query(schema);
  console.log("Schéma appliqué.");

  console.log("\n=== Insertion des données de démo (002_seed.sql) ===");
  const seed = readFileSync(seedFile, "utf8");
  await client.query(seed);
  console.log("Données insérées.");

  const { rows } = await client.query("SELECT COUNT(*) FROM properties");
  console.log(`\n✓ ${rows[0].count} annonces en base.`);

  await client.end();
  console.log("\nTerminé. Tu peux supprimer ce fichier.");
}

run().catch((err) => {
  console.error("Erreur:", err.message);
  client.end();
  process.exit(1);
});
