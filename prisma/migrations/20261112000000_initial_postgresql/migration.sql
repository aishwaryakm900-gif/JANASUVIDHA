-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CITIZEN', 'OFFICIAL', 'SUPERVISOR', 'ADMIN', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLUTION_SUBMITTED', 'VERIFIED', 'REOPENED', 'ESCALATED', 'CLOSED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SubmissionSource" AS ENUM ('VOICE_KIOSK', 'QR_PORTAL', 'CITIZEN_WEB', 'PHONE_IVR');

-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'AVAILABLE', 'NOTIFICATION_SENT', 'CLOSED');

-- CreateTable
CREATE TABLE "Hospital" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hospital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "hospitalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Official" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "officialId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OFFICIAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Official_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "complaintNumber" TEXT NOT NULL,
    "originalLanguage" TEXT NOT NULL DEFAULT 'kn',
    "languageCode" TEXT NOT NULL DEFAULT 'kn',
    "originalTranscript" TEXT NOT NULL,
    "englishTranslation" TEXT NOT NULL,
    "summary" VARCHAR(255) NOT NULL,
    "category" TEXT NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "hospitalId" TEXT NOT NULL,
    "departmentId" TEXT,
    "assignedOfficialId" TEXT,
    "reportingSource" "SubmissionSource" NOT NULL DEFAULT 'VOICE_KIOSK',
    "reportingLocation" TEXT NOT NULL,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'PENDING',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "idempotencyKey" TEXT,
    "citizenName" TEXT,
    "citizenPhone" TEXT,
    "medicineName" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "floorOrBlock" TEXT,
    "resolutionNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "payload" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplaintNumberSequence" (
    "year" INTEGER NOT NULL,
    "nextValue" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplaintNumberSequence_pkey" PRIMARY KEY ("year")
);

-- CreateTable
CREATE TABLE "IvrCall" (
    "callSid" TEXT NOT NULL,
    "transcript" TEXT,
    "languageCode" TEXT NOT NULL DEFAULT 'en',
    "status" TEXT NOT NULL DEFAULT 'COLLECTING',
    "complaintId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IvrCall_pkey" PRIMARY KEY ("callSid")
);

-- CreateTable
CREATE TABLE "ComplaintEvent" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplaintEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivateAvailabilityRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" TEXT NOT NULL,
    "verifiedPhoneNumber" TEXT NOT NULL,
    "requestedResource" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL DEFAULT 'MEDICINE',
    "originalTranscript" TEXT NOT NULL,
    "englishTranslation" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL DEFAULT 'kn',
    "hospitalId" TEXT NOT NULL,
    "departmentId" TEXT,
    "status" "AvailabilityStatus" NOT NULL DEFAULT 'PENDING',
    "otpVerified" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivateAvailabilityRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplaintObservation" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "observationType" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "durationSinceLastCleaning" TEXT,
    "languageCode" TEXT NOT NULL DEFAULT 'kn',
    "originalTranscript" TEXT,
    "location" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplaintObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "complaintId" TEXT,
    "submissionStatus" TEXT NOT NULL DEFAULT 'SUCCESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "availabilityRequestId" TEXT,
    "recipient" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "deliveryStatus" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_code_key" ON "Hospital"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Official_officialId_key" ON "Official"("officialId");

-- CreateIndex
CREATE UNIQUE INDEX "Official_email_key" ON "Official"("email");

-- CreateIndex
CREATE INDEX "Official_departmentId_idx" ON "Official"("departmentId");

-- CreateIndex
CREATE INDEX "Official_role_idx" ON "Official"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Complaint_complaintNumber_key" ON "Complaint"("complaintNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Complaint_idempotencyKey_key" ON "Complaint"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "Complaint"("status");

-- CreateIndex
CREATE INDEX "Complaint_category_idx" ON "Complaint"("category");

-- CreateIndex
CREATE INDEX "Complaint_departmentId_idx" ON "Complaint"("departmentId");

-- CreateIndex
CREATE INDEX "Complaint_hospitalId_idx" ON "Complaint"("hospitalId");

-- CreateIndex
CREATE INDEX "Complaint_submittedAt_idx" ON "Complaint"("submittedAt");

-- CreateIndex
CREATE INDEX "Complaint_idempotencyKey_idx" ON "Complaint"("idempotencyKey");

-- CreateIndex
CREATE INDEX "IvrCall_status_idx" ON "IvrCall"("status");

-- CreateIndex
CREATE INDEX "ComplaintEvent_complaintId_idx" ON "ComplaintEvent"("complaintId");

-- CreateIndex
CREATE INDEX "Evidence_complaintId_idx" ON "Evidence"("complaintId");

-- CreateIndex
CREATE UNIQUE INDEX "PrivateAvailabilityRequest_requestNumber_key" ON "PrivateAvailabilityRequest"("requestNumber");

-- CreateIndex
CREATE INDEX "PrivateAvailabilityRequest_status_idx" ON "PrivateAvailabilityRequest"("status");

-- CreateIndex
CREATE INDEX "PrivateAvailabilityRequest_requestedResource_idx" ON "PrivateAvailabilityRequest"("requestedResource");

-- CreateIndex
CREATE INDEX "PrivateAvailabilityRequest_verifiedPhoneNumber_idx" ON "PrivateAvailabilityRequest"("verifiedPhoneNumber");

-- CreateIndex
CREATE INDEX "PrivateAvailabilityRequest_departmentId_idx" ON "PrivateAvailabilityRequest"("departmentId");

-- CreateIndex
CREATE INDEX "PrivateAvailabilityRequest_hospitalId_idx" ON "PrivateAvailabilityRequest"("hospitalId");

-- CreateIndex
CREATE INDEX "ComplaintObservation_complaintId_idx" ON "ComplaintObservation"("complaintId");

-- CreateIndex
CREATE INDEX "ComplaintObservation_observationType_idx" ON "ComplaintObservation"("observationType");

-- CreateIndex
CREATE INDEX "ComplaintObservation_createdAt_idx" ON "ComplaintObservation"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_idempotencyKey_key" ON "Submission"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Submission_idempotencyKey_idx" ON "Submission"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Notification_availabilityRequestId_idx" ON "Notification"("availabilityRequestId");

-- CreateIndex
CREATE INDEX "Notification_recipient_idx" ON "Notification"("recipient");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Official" ADD CONSTRAINT "Official_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Official" ADD CONSTRAINT "Official_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Complaint" ADD CONSTRAINT "Complaint_assignedOfficialId_fkey" FOREIGN KEY ("assignedOfficialId") REFERENCES "Official"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintEvent" ADD CONSTRAINT "ComplaintEvent_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateAvailabilityRequest" ADD CONSTRAINT "PrivateAvailabilityRequest_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivateAvailabilityRequest" ADD CONSTRAINT "PrivateAvailabilityRequest_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintObservation" ADD CONSTRAINT "ComplaintObservation_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_availabilityRequestId_fkey" FOREIGN KEY ("availabilityRequestId") REFERENCES "PrivateAvailabilityRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

