import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { SupabaseSyncService } from "../lib/services/supabase-sync.service";

async function main() {
  console.log("=============================================================");
  console.log("  JANASUVIDHA: COMPREHENSIVE SUPABASE DATA SYNC PIPELINE");
  console.log("=============================================================\n");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!url) {
    console.warn("⚠️  NEXT_PUBLIC_SUPABASE_URL is not set in .env.local or .env");
    console.log("Please add your Supabase credentials to .env.local:\n");
    console.log("NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co");
    console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...");
    console.log("SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...\n");
    console.log("Then execute this script again: npx tsx scripts/sync-to-supabase.ts\n");
    process.exit(1);
  }

  console.log(`Connecting to Supabase at: ${url}`);
  console.log("Reading data from data/janasuvidha-db.json...\n");

  const report = await SupabaseSyncService.syncAllDataToSupabase();

  console.log("-------------------------------------------------------------");
  console.log(`Hospitals Synced:        ${report.hospitalsSynced}`);
  console.log(`Departments Synced:      ${report.departmentsSynced}`);
  console.log(`Officials Synced:        ${report.officialsSynced}`);
  console.log(`Complaints Synced:       ${report.complaintsSynced}`);
  console.log(`Private Requests Synced: ${report.privateRequestsSynced}`);
  console.log(`Observations Synced:     ${report.observationsSynced}`);
  console.log(`Notifications Synced:    ${report.notificationsSynced}`);
  console.log(`Submissions Synced:      ${report.submissionsSynced}`);
  console.log(`Atomic Counter:          ${report.counterSynced}`);
  console.log("-------------------------------------------------------------");

  if (report.errors.length > 0) {
    console.warn("\n⚠️ Encountered the following errors during sync:");
    report.errors.forEach((e) => console.error(`  - ${e}`));
    console.log("\nMake sure you have created the tables in Supabase by running the SQL in: supabase/schema.sql");
    process.exit(1);
  } else {
    console.log("\n🎉 ALL DATA HAS BEEN SUCCESSFULLY CONNECTED AND SYNCED TO SUPABASE!");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});

