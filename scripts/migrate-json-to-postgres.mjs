import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const file = new URL("../data/janasuvidha-db.json", import.meta.url);

function enumValue(value, fallback) {
  const normalized = String(value || fallback).toUpperCase().replaceAll(" ", "_");
  return normalized;
}

async function main() {
  const legacy = JSON.parse(await readFile(file, "utf8"));
  const hospital = await db.hospital.upsert({
    where: { code: "OPD-BAL-01" },
    update: {},
    create: {
      code: "OPD-BAL-01",
      name: "Outpatient Department, Ballari",
      district: "Ballari",
      state: "Karnataka",
      pincode: "560002",
      type: "Tertiary Government Teaching Hospital",
    },
  });

  for (const item of legacy.complaints || []) {
    const departmentName = item.departmentName || item.category || "Hospital Services";
    const departmentCode = departmentName.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 60);
    const department = await db.department.upsert({
      where: { code: departmentCode },
      update: { name: departmentName, hospitalId: hospital.id },
      create: { code: departmentCode, name: departmentName, category: item.category || departmentName, hospitalId: hospital.id },
    });
    const complaintNumber = item.complaintNumber || item.ticketNumber;
    if (!complaintNumber) continue;

    const saved = await db.complaint.upsert({
      where: { complaintNumber },
      update: { payload: item },
      create: {
        id: item.id || undefined,
        complaintNumber,
        originalLanguage: item.originalLanguage || "English",
        languageCode: item.languageCode || "en",
        originalTranscript: item.originalTranscript || "",
        englishTranslation: item.englishTranslation || item.originalTranscript || "",
        summary: String(item.summary || "Hospital grievance").slice(0, 255),
        category: item.category || departmentName,
        priority: ["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(enumValue(item.priority, "MEDIUM")) ? enumValue(item.priority, "MEDIUM") : "MEDIUM",
        hospitalId: hospital.id,
        departmentId: department.id,
        reportingSource: ["VOICE_KIOSK", "QR_PORTAL", "CITIZEN_WEB", "PHONE_IVR"].includes(enumValue(item.source, "VOICE_KIOSK")) ? enumValue(item.source, "VOICE_KIOSK") : "VOICE_KIOSK",
        reportingLocation: item.wardOrLocation || item.location || "Outpatient Department, Ballari",
        status: ["PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLUTION_SUBMITTED", "VERIFIED", "REOPENED", "ESCALATED", "CLOSED"].includes(enumValue(item.status, "PENDING")) ? enumValue(item.status, "PENDING") : "PENDING",
        submittedAt: item.submittedAt ? new Date(item.submittedAt) : new Date(),
        recurrenceCount: item.recurrenceCount || 1,
        idempotencyKey: item.idempotencyKey || undefined,
        citizenName: item.citizenName || undefined,
        citizenPhone: item.citizenPhone || undefined,
        medicineName: item.medicineName || undefined,
        visibility: item.visibility || "PUBLIC",
        floorOrBlock: item.floorOrBlock || undefined,
        resolutionNotes: item.resolutionNotes || undefined,
        resolvedAt: item.resolvedAt ? new Date(item.resolvedAt) : undefined,
        verifiedAt: item.verifiedAt ? new Date(item.verifiedAt) : undefined,
        payload: item,
      },
    });
    if (item.events?.length) {
      await db.complaintEvent.createMany({
        skipDuplicates: true,
        data: item.events.map((event) => ({
          id: event.id,
          complaintId: saved.id,
          eventType: event.eventType || "CREATED",
          description: event.description || "Complaint history imported from JSON store.",
          performedBy: event.performedBy || "System",
          timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
        })),
      });
    }
    if (item.evidence?.length) {
      await db.evidence.createMany({
        skipDuplicates: true,
        data: item.evidence.map((evidence) => ({
          id: evidence.id,
          complaintId: saved.id,
          fileUrl: evidence.fileUrl,
          evidenceType: evidence.type || "BEFORE",
          uploadedBy: evidence.uploadedBy || "System",
          createdAt: evidence.uploadedAt ? new Date(evidence.uploadedAt) : new Date(),
        })),
      });
    }
  }
  console.log(`Migrated ${legacy.complaints?.length || 0} complaint records into PostgreSQL.`);
}

main()
  .catch((error) => {
    console.error("JSON to PostgreSQL migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => db.$disconnect());
