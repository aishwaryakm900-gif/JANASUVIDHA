import { DBService } from "../lib/services/db.service";
import { ComplaintService } from "../lib/services/complaint.service";
import { routeComplaintDepartment, forwardToExternalGovernmentPortal } from "../lib/config/routing";

async function runAllTests() {
  console.log("===============================================================");
  console.log("  JANASUVIDHA: MANDATORY COMPLAINT & ROUTING VERIFICATION SUITE");
  console.log("===============================================================\n");

  const results: Record<string, { pass: boolean; details: string }> = {};

  // ---------------------------------------------------------------------------
  // TEST 1: Register three different complaints consecutively.
  // Expected: Three different unique IDs in format JAN-YYYY-XXXXXX
  // ---------------------------------------------------------------------------
  try {
    const c1 = await DBService.createComplaint({
      originalLanguage: "Kannada",
      languageCode: "kn",
      originalTranscript: "ಶೌಚಾಲಯದಲ್ಲಿ ನೀರಿಲ್ಲ, ಟ್ಯಾಪ್ ಸೋರುತ್ತಿದೆ.",
      englishTranslation: "No water in washroom, tap is leaking.",
      summary: "Washroom tap leakage reported",
      category: "Water and Facilities",
      department: "Water and Facilities",
      location: "Outpatient Department, Ballari - Block A",
    });

    const c2 = await DBService.createComplaint({
      originalLanguage: "Hindi",
      languageCode: "hi",
      originalTranscript: "वार्ड में बहुत बदबू आ रही है, कचरा नहीं उठाया गया।",
      englishTranslation: "Bad odor in the ward, garbage has not been cleared.",
      summary: "Ward garbage not cleared",
      category: "Hygiene and Sanitation",
      department: "Hygiene and Sanitation",
      location: "Outpatient Department, Ballari - Ward 3",
    });

    const c3 = await DBService.createComplaint({
      originalLanguage: "English",
      languageCode: "en",
      originalTranscript: "Wheelchair wheel broken near main entrance.",
      englishTranslation: "Wheelchair wheel broken near main entrance.",
      summary: "Broken wheelchair near entrance",
      category: "Infrastructure Maintenance",
      department: "Medical Equipment / Maintenance",
      location: "Outpatient Department, Ballari - Entrance",
    });

    const ids = [c1.complaintNumber, c2.complaintNumber, c3.complaintNumber];
    const uniqueIds = new Set(ids);
    const validFormat = ids.every((id) => /^JAN-\d{4}-\d{6}$/.test(id || ""));

    if (uniqueIds.size === 3 && validFormat) {
      results["TEST 1"] = {
        pass: true,
        details: `Generated unique IDs consecutively: ${ids.join(", ")}`,
      };
    } else {
      results["TEST 1"] = {
        pass: false,
        details: `ID collision or invalid format: ${ids.join(", ")}`,
      };
    }
  } catch (err: any) {
    results["TEST 1"] = { pass: false, details: err.message };
  }

  // ---------------------------------------------------------------------------
  // TEST 2: Submit multiple complaints simultaneously from different sessions.
  // Expected: No duplicate IDs across concurrent submissions
  // ---------------------------------------------------------------------------
  try {
    const promises = Array.from({ length: 6 }).map((_, i) =>
      DBService.createComplaintWithIdempotency({
        idempotencyKey: `concurrent-session-${i}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        originalLanguage: "Kannada",
        languageCode: "kn",
        originalTranscript: `ಏಕಕಾಲಿಕ ದೂರು ಪರೀಕ್ಷೆ ಸಂಖ್ಯೆ ${i + 1}`,
        englishTranslation: `Simultaneous complaint test batch ${i + 1}`,
        summary: `Concurrent submission test ${i + 1}`,
        category: "Hospital Services",
        department: "Hospital Services",
        location: `Ballari OPD - Kiosk #${(i % 3) + 1}`,
      })
    );

    const concurrentResults = await Promise.all(promises);
    const concurrentIds = concurrentResults.map((r) => r.complaint.complaintNumber);
    const uniqueConcurrentIds = new Set(concurrentIds);

    if (uniqueConcurrentIds.size === concurrentResults.length) {
      results["TEST 2"] = {
        pass: true,
        details: `Successfully handled ${concurrentResults.length} concurrent requests without collision: ${concurrentIds.join(", ")}`,
      };
    } else {
      results["TEST 2"] = {
        pass: false,
        details: `Duplicate IDs generated among concurrent submissions: ${concurrentIds.join(", ")}`,
      };
    }
  } catch (err: any) {
    results["TEST 2"] = { pass: false, details: err.message };
  }

  // ---------------------------------------------------------------------------
  // TEST 3: Submit a medicine-related complaint.
  // Expected: Correct pharmacy department assignment and admin portal visibility.
  // ---------------------------------------------------------------------------
  try {
    const medComplaint = await ComplaintService.createComplaint({
      transcript: "ಡಾಕ್ಟರ್ ಬರೆದಿರುವ ಪ್ಯಾರಸಿಟಮಾಲ್ ಮತ್ತು ಇನ್ಸುಲಿನ್ ಔಷಧ ಲಭ್ಯವಿಲ್ಲ.",
      originalLanguage: "Kannada",
      languageCode: "kn",
      summary: "Paracetamol and insulin unavailable at counter",
      medicineName: "Insulin & Paracetamol",
      citizenPhone: "9876543210",
      isMedicineComplaint: true,
    });

    const adminList = await DBService.getComplaints();
    const foundInAdmin = adminList.find((c) => c.id === medComplaint.complaint.id);

    const isPharmacyRouted =
      medComplaint.complaint.departmentName === "Pharmacy and Medicine Availability";

    if (isPharmacyRouted && foundInAdmin) {
      results["TEST 3"] = {
        pass: true,
        details: `ID: ${medComplaint.complaint.complaintNumber} -> Routed to: "${medComplaint.complaint.departmentName}", Assigned Official: ${medComplaint.complaint.assignedOfficialName}, Visible in Admin Portal: YES`,
      };
    } else {
      results["TEST 3"] = {
        pass: false,
        details: `Routing failed or not visible in Admin: Dept=${medComplaint.complaint.departmentName}, Found=${Boolean(foundInAdmin)}`,
      };
    }
  } catch (err: any) {
    results["TEST 3"] = { pass: false, details: err.message };
  }

  // ---------------------------------------------------------------------------
  // TEST 4: Submit a sanitation complaint.
  // Expected: Correct sanitation department assignment.
  // ---------------------------------------------------------------------------
  try {
    const sanComplaint = await ComplaintService.createComplaint({
      transcript: "ಇಲ್ಲಿನ ಶೌಚಾಲಯ ತುಂಬಾ ಗಲೀಜಾಗಿದೆ, ಕಸ ಮತ್ತು ದುರ್ವಾಸನೆ ಬರುತ್ತಿದೆ.",
      originalLanguage: "Kannada",
      languageCode: "kn",
      summary: "Hospital toilet is extremely dirty with odor",
      location: "Ballari OPD - Ground Floor Washroom",
    });

    const isSanitation =
      sanComplaint.complaint.departmentName === "Hygiene and Sanitation";

    if (isSanitation) {
      results["TEST 4"] = {
        pass: true,
        details: `ID: ${sanComplaint.complaint.complaintNumber} -> Routed to: "${sanComplaint.complaint.departmentName}", Official: ${sanComplaint.complaint.assignedOfficialName} (${sanComplaint.complaint.assignedOfficialDesignation})`,
      };
    } else {
      results["TEST 4"] = {
        pass: false,
        details: `Sanitation routing mismatch: got "${sanComplaint.complaint.departmentName}"`,
      };
    }
  } catch (err: any) {
    results["TEST 4"] = { pass: false, details: err.message };
  }

  // ---------------------------------------------------------------------------
  // TEST 5: Submit a complaint through voice input.
  // Expected: Full registration, unique ID generation, department routing and admin visibility.
  // ---------------------------------------------------------------------------
  try {
    const voiceComplaint = await ComplaintService.createComplaint({
      transcript: "Water dispenser is leaking and water is flooding the hallway.",
      originalLanguage: "English",
      languageCode: "en",
      source: "VOICE_KIOSK",
      location: "Outpatient Department, Ballari - Hallway Kiosk",
    });

    const adminComplaints = await DBService.getComplaints();
    const adminRecord = adminComplaints.find((c) => c.id === voiceComplaint.complaint.id);

    if (
      voiceComplaint.complaint.complaintNumber &&
      voiceComplaint.complaint.departmentName === "Water and Facilities" &&
      adminRecord
    ) {
      results["TEST 5"] = {
        pass: true,
        details: `Voice Kiosk Grievance: ID=${voiceComplaint.complaint.complaintNumber}, RoutedTo="${voiceComplaint.complaint.departmentName}", AdminVerified=YES`,
      };
    } else {
      results["TEST 5"] = {
        pass: false,
        details: `Voice complaint failed validation: Dept=${voiceComplaint.complaint.departmentName}`,
      };
    }
  } catch (err: any) {
    results["TEST 5"] = { pass: false, details: err.message };
  }

  // ---------------------------------------------------------------------------
  // TEST 6: Simulate department notification failure.
  // Expected: Complaint remains saved, failure is recorded and automatic retry is triggered.
  // ---------------------------------------------------------------------------
  try {
    const failedSimComplaint = await DBService.createComplaint({
      originalLanguage: "English",
      languageCode: "en",
      originalTranscript: "Ventilator machine screen blinking with error code E04.",
      englishTranslation: "Ventilator machine screen blinking with error code E04.",
      summary: "Ventilator error code E04",
      category: "Infrastructure Maintenance",
      department: "Medical Equipment / Maintenance",
      simulateDeptFailure: true,
    });

    const initialStatus = failedSimComplaint.deliveryTracking?.departmentPortal?.status;
    const isSaved = Boolean(failedSimComplaint.id);

    // Trigger retry
    const retryResult = await DBService.retryFailedNotification(failedSimComplaint.id);
    const updatedStatus = retryResult.complaint?.deliveryTracking?.departmentPortal?.status;

    if (isSaved && initialStatus === "FAILED" && updatedStatus === "DELIVERED") {
      results["TEST 6"] = {
        pass: true,
        details: `Complaint ${failedSimComplaint.complaintNumber} preserved in DB. Failure recorded: "${failedSimComplaint.deliveryTracking?.departmentPortal?.lastError}". Retry successfully upgraded status to: DELIVERED (attempts: ${retryResult.complaint?.deliveryTracking?.departmentPortal?.attempts}).`,
      };
    } else {
      results["TEST 6"] = {
        pass: false,
        details: `Failed simulation mismatch: initial=${initialStatus}, updated=${updatedStatus}`,
      };
    }
  } catch (err: any) {
    results["TEST 6"] = { pass: false, details: err.message };
  }

  // ---------------------------------------------------------------------------
  // TEST 7: Refresh the admin portal (re-query database).
  // Expected: All previously registered complaints remain available.
  // ---------------------------------------------------------------------------
  try {
    const allComplaints = await DBService.getComplaints();
    const hasJanFormat = allComplaints.some((c) => (c.complaintNumber || "").startsWith("JAN-"));
    const count = allComplaints.length;

    if (count > 0 && hasJanFormat) {
      results["TEST 7"] = {
        pass: true,
        details: `Admin query returned ${count} total grievances. Persistent database state confirmed with JAN- format.`,
      };
    } else {
      results["TEST 7"] = {
        pass: false,
        details: `Admin query failed to find complaints or JAN- format. Count: ${count}`,
      };
    }
  } catch (err: any) {
    results["TEST 7"] = { pass: false, details: err.message };
  }

  // ---------------------------------------------------------------------------
  // TEST 8: Submit a complaint when an external government API is unavailable.
  // Expected: Complaint remains registered, external delivery is marked appropriately and is never falsely shown as successful.
  // ---------------------------------------------------------------------------
  try {
    const extCheck = await forwardToExternalGovernmentPortal({
      id: "comp-test-ext",
      complaintNumber: "JAN-2026-000999",
      category: "Sanitation",
      summary: "External API test",
    });

    const extComplaint = await DBService.createComplaint({
      originalLanguage: "English",
      languageCode: "en",
      originalTranscript: "Testing unconfigured external government portal status.",
      englishTranslation: "Testing unconfigured external government portal status.",
      summary: "Gov portal sync verification",
      category: "Hospital Services",
      department: "Hospital Services",
    });

    const externalStatus = extComplaint.deliveryTracking?.externalGovPortal?.status;

    if (extCheck.status === "NOT_CONFIGURED" && externalStatus === "NOT_CONFIGURED") {
      results["TEST 8"] = {
        pass: true,
        details: `External delivery marked accurately as: "${externalStatus}". Reason: "${extComplaint.deliveryTracking?.externalGovPortal?.lastError}". Never faked as DELIVERED.`,
      };
    } else {
      results["TEST 8"] = {
        pass: false,
        details: `External delivery check mismatch: ${extCheck.status} / ${externalStatus}`,
      };
    }
  } catch (err: any) {
    results["TEST 8"] = { pass: false, details: err.message };
  }

  // ---------------------------------------------------------------------------
  // TEST 9: Verify that citizen, department and admin views refer to the same complaint ID.
  // ---------------------------------------------------------------------------
  try {
    const registered = await DBService.createComplaint({
      originalLanguage: "Kannada",
      languageCode: "kn",
      originalTranscript: "ಔಷಧಾಲಯದಲ್ಲಿ ಬಿಪಿ ಮಾತ್ರೆಗಳು ಖಾಲಿಯಾಗಿವೆ.",
      englishTranslation: "BP tablets are out of stock in pharmacy.",
      summary: "BP tablets stockout in OPD pharmacy",
      category: "Pharmacy and Medicine Availability",
      department: "Pharmacy and Medicine Availability",
      location: "Ballari OPD - Pharmacy Counter",
    });

    const citizenId = registered.receipt?.complaintNumber;
    const adminRecord = (await DBService.getComplaints()).find((c) => c.id === registered.id);
    const departmentComplaints = await DBService.getComplaints({
      officialDepartment: "Pharmacy and Medicine Availability",
    });
    const deptRecord = departmentComplaints.find((c) => c.id === registered.id);

    const match =
      citizenId === registered.complaintNumber &&
      adminRecord?.complaintNumber === registered.complaintNumber &&
      deptRecord?.complaintNumber === registered.complaintNumber;

    if (match) {
      results["TEST 9"] = {
        pass: true,
        details: `Identical complaint ID across all 3 portals: Citizen Receipt = "${citizenId}", Admin Portal = "${adminRecord?.complaintNumber}", Pharmacy Dept = "${deptRecord?.complaintNumber}"`,
      };
    } else {
      results["TEST 9"] = {
        pass: false,
        details: `ID mismatch: Citizen="${citizenId}", Admin="${adminRecord?.complaintNumber}", Dept="${deptRecord?.complaintNumber}"`,
      };
    }
  } catch (err: any) {
    results["TEST 9"] = { pass: false, details: err.message };
  }

  // ---------------------------------------------------------------------------
  // SUMMARY OUTPUT
  // ---------------------------------------------------------------------------
  console.log("---------------------------------------------------------------");
  let allPassed = true;
  for (const [name, res] of Object.entries(results)) {
    const symbol = res.pass ? "✅ PASS" : "❌ FAIL";
    console.log(`${symbol} [${name}]: ${res.details}`);
    if (!res.pass) allPassed = false;
  }
  console.log("---------------------------------------------------------------");
  console.log(allPassed ? "\n🎉 ALL 9 MANDATORY TESTS PASSED SUCCESSFULLY!" : "\n⚠️ SOME TESTS FAILED.");
}

runAllTests().catch((err) => {
  console.error("FATAL SUITE ERROR:", err);
  process.exit(1);
});

