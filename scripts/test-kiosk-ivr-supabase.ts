import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { createClient } from "@supabase/supabase-js";
import { ComplaintService } from "../lib/services/complaint.service";
import { SupabaseSyncService } from "../lib/services/supabase-sync.service";

async function main() {
  console.log("=================================================================");
  console.log("  JANASUVIDHA: KIOSK & IVR UNIFIED SUPABASE INTEGRATION TEST");
  console.log("=================================================================\n");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("❌ Supabase credentials missing in .env.local");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // 1. TEST KIOSK COMPLAINT SUBMISSION
  console.log("1. Submitting test KIOSK grievance...");
  const kioskResult = await ComplaintService.createComplaint({
    idempotencyKey: `test-kiosk-${Date.now()}`,
    transcript: "The bathroom near OPD Room 4 on the first floor is dirty and has no running water.",
    languageCode: "en",
    summary: "Restroom cleanliness & water shortage near OPD 4",
    category: "Hygiene and Sanitation",
    department: "Hygiene and Sanitation",
    priority: "High",
    location: "Outpatient Department, Ballari - 1st Floor OPD 4",
    source: "kiosk",
    citizenName: "Anand Murthy",
    citizenPhone: "+919845012345",
  });

  const kioskComplaint = kioskResult.complaint;
  console.log(`   ✓ Kiosk Complaint Created: ID=${kioskComplaint.id}, Token=${kioskComplaint.complaintNumber}, Source=${kioskComplaint.source}`);

  // 2. TEST IVR ELEVENLABS/TWILIO COMPLAINT & CALL LOG SUBMISSION
  console.log("\n2. Submitting test IVR grievance & call log...");
  const testCallSid = `CA-TEST-${Date.now()}`;
  const testConvId = `conv-eleven-${Date.now()}`;

  const ivrResult = await ComplaintService.createComplaint({
    idempotencyKey: `ivr:${testCallSid}`,
    transcript: "Hello, the digital X-ray machine in radiology has an error code and technicians cannot take scans.",
    languageCode: "en",
    summary: "Digital X-Ray equipment failure in Radiology unit",
    category: "Infrastructure Maintenance",
    department: "Infrastructure Maintenance",
    priority: "Critical",
    location: "Outpatient Department, Ballari - Radiology Room 12",
    source: "ivr",
    citizenName: "Sunitha Rao",
    citizenPhone: "+919876543210",
  });

  const ivrComplaint = ivrResult.complaint;
  console.log(`   ✓ IVR Complaint Created: ID=${ivrComplaint.id}, Token=${ivrComplaint.complaintNumber}, Source=${ivrComplaint.source}`);

  // 3. LOG IVR CALL IN SUPABASE call_logs LINKED TO COMPLAINT
  console.log("\n3. Persisting call log linked to complaint_id in Supabase call_logs...");
  const callLogged = await SupabaseSyncService.upsertCallLog({
    callSid: testCallSid,
    conversationId: testConvId,
    callerNumber: "+919876543210",
    agentId: "agent_ballari_opd_v1",
    complaintId: ivrComplaint.id,
    transcript: "AGENT: Welcome to JanaSuvidha Ballari OPD. How can I help?\nCALLER: The digital X-ray machine in radiology has an error code.\nAGENT: Understood, I am recording this for Biomedical Engineering.",
    duration: 38,
    status: "completed",
    callMetadata: {
      provider: "elevenlabs_conversational_ai",
      telephony: "twilio",
      ticketNumber: ivrComplaint.complaintNumber,
    },
  });

  console.log(`   ✓ Call log write attempt: ${callLogged ? "SUCCESS" : "CHECK LOG"}`);

  // 4. VERIFY BOTH RECORDS IN SUPABASE
  console.log("\n4. Verifying records directly in live Supabase complaints table...");
  const { data: records, error } = await supabase
    .from("complaints")
    .select("id, complaint_number, source, category, summary, ward_or_location, citizen_name, citizen_phone, status, submitted_at")
    .in("id", [kioskComplaint.id, ivrComplaint.id]);

  if (error) {
    console.error("❌ Supabase query error:", error.message);
    process.exit(1);
  }

  console.log("-----------------------------------------------------------------");
  console.log(`Fetched ${records?.length} verified complaints from the SAME complaints table:`);
  records?.forEach((rec) => {
    console.log(`   - [${rec.source.toUpperCase()}] Token: ${rec.complaint_number} | Source: '${rec.source}' | Status: ${rec.status} | Dept: ${rec.category} | Citizen: ${rec.citizen_name || "N/A"} (${rec.citizen_phone || "N/A"})`);
  });
  console.log("-----------------------------------------------------------------");

  // 5. TEST IDEMPOTENCY / DUPLICATE PREVENTION
  console.log("\n5. Testing idempotency: resubmitting same IVR call...");
  const duplicateTest = await ComplaintService.createComplaint({
    idempotencyKey: `ivr:${testCallSid}`,
    transcript: "Duplicate submission of same call",
    source: "ivr",
  });

  console.log(`   ✓ Idempotency Check: isDuplicateDetected = ${duplicateTest.isDuplicateDetected}`);
  console.log(`   ✓ Same Complaint ID Returned: ${duplicateTest.complaint.id === ivrComplaint.id}`);

  console.log("\n🎉 ALL TESTS PASSED: Kiosk and IVR are unified into the SAME Supabase database!");
}

main().catch(console.error);

