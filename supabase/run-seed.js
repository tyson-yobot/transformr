#!/usr/bin/env node
/**
 * Seed runner — executes SQL files against the Supabase Postgres database.
 * Usage: node supabase/run-seed.js [file1.sql] [file2.sql] ...
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const CONNECTION_STRING = null; // unused — using explicit config below

const FILES = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      path.join(__dirname, 'seed.sql'),
      path.join(__dirname, 'seeds', 'challenge_definitions.sql'),
    ];

// Tables to verify after seeding (row count check)
const VERIFY_TABLES = [
  'exercises',
  'foods',
  'achievements',
  'workout_templates',
  'challenge_definitions',
];

async function truncateSeedTables(client) {
  console.log('\n▶ Truncating seed tables…');
  // Order matters: child tables before parents to satisfy FK constraints
  await client.query(`
    TRUNCATE TABLE
      workout_template_exercises,
      workout_templates,
      challenge_definitions,
      achievements,
      exercises,
      foods
    RESTART IDENTITY CASCADE
  `);
  console.log('✓ Seed tables cleared.');
}

async function runFile(client, filePath) {
  console.log(`\n▶ Running: ${path.basename(filePath)}`);
  const sql = fs.readFileSync(filePath, 'utf8');
  await client.query(sql);
  console.log(`✓ ${path.basename(filePath)} — complete`);
}

async function verifyCounts(client) {
  console.log('\n── Row counts ──────────────────────────');
  for (const table of VERIFY_TABLES) {
    try {
      const { rows } = await client.query(
        `SELECT COUNT(*) AS count FROM ${table}`
      );
      console.log(`  ${table}: ${rows[0].count}`);
    } catch (err) {
      console.log(`  ${table}: (not found — ${err.message})`);
    }
  }
  console.log('────────────────────────────────────────');
}

async function main() {
  const client = new Client({
    host: 'db.horqwbfsqqmzdbbafvov.supabase.co',
    port: 6543,
    database: 'postgres',
    user: 'postgres',
    password: 'Transformr2026!',
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Connecting to Supabase Postgres…');
    await client.connect();
    console.log('Connected.');

    await truncateSeedTables(client);

    for (const file of FILES) {
      await runFile(client, path.resolve(file));
    }

    await verifyCounts(client);
    console.log('\n✅ All seed files executed successfully.');
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
