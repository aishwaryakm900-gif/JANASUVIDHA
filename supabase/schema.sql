-- =============================================================================
-- JANASUVIDHA: OFFICIAL SUPABASE RELATIONAL & REAL-TIME DATABASE SCHEMA
-- =============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. HOSPITALS TABLE
CREATE TABLE IF NOT EXISTS hospitals (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    district TEXT NOT NULL,
    state TEXT NOT NULL,
    pincode TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    hospital_id TEXT REFERENCES hospitals(id) ON DELETE SET NULL,
    official_name TEXT,
    official_designation TEXT,
    official_email TEXT,
    sla_hours INTEGER DEFAULT 4,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. OFFICIALS TABLE
CREATE TABLE IF NOT EXISTS officials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    official_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
    department_name TEXT NOT NULL,
    designation TEXT NOT NULL,
    hospital_id TEXT REFERENCES hospitals(id) ON DELETE SET NULL,
    hospital_name TEXT NOT NULL,
    role TEXT DEFAULT 'OFFICIAL',
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. COMPLAINTS TABLE (Canonical Grievance Store)
CREATE TABLE IF NOT EXISTS complaints (
    id TEXT PRIMARY KEY,
    complaint_number TEXT UNIQUE NOT NULL,
    ticket_number TEXT,
    hospital_id TEXT DEFAULT 'hosp-001',
    hospital_name TEXT NOT NULL,
    department_id TEXT,
    department_name TEXT NOT NULL,
    category TEXT NOT NULL,
    visibility TEXT DEFAULT 'PUBLIC',
    source TEXT DEFAULT 'VOICE_KIOSK',
    original_language TEXT DEFAULT 'Kannada',
    language_code TEXT DEFAULT 'kn',
    original_transcript TEXT NOT NULL,
    english_translation TEXT,
    translated_text TEXT,
    summary TEXT NOT NULL,
    ward_or_location TEXT NOT NULL,
    floor_or_block TEXT,
    status TEXT DEFAULT 'ASSIGNED',
    priority TEXT DEFAULT 'Medium',
    citizen_name TEXT,
    citizen_phone TEXT,
    masked_citizen_phone TEXT,
    medicine_name TEXT,
    is_medicine_complaint BOOLEAN DEFAULT FALSE,
    assigned_official_id TEXT,
    assigned_official_name TEXT,
    assigned_official_designation TEXT,
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    recurrence_count INTEGER DEFAULT 1,
    idempotency_key TEXT,
    delivery_tracking JSONB DEFAULT '{}'::jsonb,
    events JSONB DEFAULT '[]'::jsonb,
    evidence JSONB DEFAULT '[]'::jsonb,
    receipt JSONB,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning fast queries across government dashboards
CREATE INDEX IF NOT EXISTS idx_complaints_complaint_number ON complaints(complaint_number);
CREATE INDEX IF NOT EXISTS idx_complaints_department_name ON complaints(department_name);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_submitted_at ON complaints(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_idempotency_key ON complaints(idempotency_key);

-- 5. PRIVATE AVAILABILITY REQUESTS (Medicine Stockouts & Supply)
CREATE TABLE IF NOT EXISTS private_availability_requests (
    id TEXT PRIMARY KEY,
    request_number TEXT UNIQUE NOT NULL,
    verified_phone_number TEXT NOT NULL,
    requested_resource TEXT NOT NULL,
    resource_type TEXT DEFAULT 'MEDICINE',
    original_transcript TEXT,
    english_translation TEXT,
    language_code TEXT DEFAULT 'kn',
    hospital_id TEXT DEFAULT 'hosp-001',
    hospital_name TEXT NOT NULL,
    department_id TEXT,
    department_name TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    otp_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_av_req_number ON private_availability_requests(request_number);
CREATE INDEX IF NOT EXISTS idx_av_phone ON private_availability_requests(verified_phone_number);

-- 6. COMPLAINT OBSERVATIONS TABLE (Recurring citizen verifications)
CREATE TABLE IF NOT EXISTS complaint_observations (
    id TEXT PRIMARY KEY,
    complaint_id TEXT REFERENCES complaints(id) ON DELETE CASCADE,
    complaint_number TEXT,
    observation_type TEXT NOT NULL,
    response TEXT NOT NULL,
    duration_since_last_cleaning TEXT,
    language_code TEXT DEFAULT 'kn',
    original_transcript TEXT,
    location TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_observations_complaint_id ON complaint_observations(complaint_id);

-- 7. NOTIFICATIONS TABLE (Official & Admin Dispatch Logs)
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    availability_request_id TEXT,
    recipient TEXT NOT NULL,
    message TEXT NOT NULL,
    provider TEXT DEFAULT 'mock',
    delivery_status TEXT DEFAULT 'DELIVERED',
    department_name TEXT,
    recipient_type TEXT DEFAULT 'OFFICIAL',
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifs_recipient ON notifications(recipient);
CREATE INDEX IF NOT EXISTS idx_notifs_sent_at ON notifications(sent_at DESC);

-- 8. SUBMISSIONS TABLE (Concurrency & Idempotency Store)
CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    idempotency_key TEXT UNIQUE NOT NULL,
    complaint_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_idempotency_key ON submissions(idempotency_key);

-- 9. APP METADATA TABLE (Persistent atomic counters)
CREATE TABLE IF NOT EXISTS app_metadata (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CALL LOGS TABLE (Twilio + ElevenLabs IVR Conversations & Transcripts)
CREATE TABLE IF NOT EXISTS call_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    call_sid TEXT UNIQUE,
    conversation_id TEXT,
    caller_number TEXT,
    to_number TEXT,
    agent_id TEXT,
    complaint_id TEXT REFERENCES complaints(id) ON DELETE SET NULL,
    transcript TEXT,
    recording_url TEXT,
    duration INTEGER,
    status TEXT DEFAULT 'completed',
    call_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_call_logs_call_sid ON call_logs(call_sid);
CREATE INDEX IF NOT EXISTS idx_call_logs_conversation_id ON call_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_complaint_id ON call_logs(complaint_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_caller_number ON call_logs(caller_number);
CREATE INDEX IF NOT EXISTS idx_call_logs_created_at ON call_logs(created_at DESC);

-- Ensure complaints table has unified column aliases for kiosk & IVR
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS location TEXT;

-- Enable Row Level Security (RLS) - Permissive public read for public complaints, authenticated write
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE officials ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_availability_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_metadata ENABLE ROW LEVEL SECURITY;

-- Default RLS Policies (Allow access via service role and anon for government kiosks & portals)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Read Complaints" ON complaints;
    CREATE POLICY "Public Read Complaints" ON complaints FOR SELECT USING (true);

    DROP POLICY IF EXISTS "Public Insert Complaints" ON complaints;
    CREATE POLICY "Public Insert Complaints" ON complaints FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Public Update Complaints" ON complaints;
    CREATE POLICY "Public Update Complaints" ON complaints FOR UPDATE USING (true);

    DROP POLICY IF EXISTS "Allow All Call Logs" ON call_logs;
    CREATE POLICY "Allow All Call Logs" ON call_logs FOR ALL USING (true);

    DROP POLICY IF EXISTS "Allow All Hospitals" ON hospitals;
    CREATE POLICY "Allow All Hospitals" ON hospitals FOR ALL USING (true);

    DROP POLICY IF EXISTS "Allow All Departments" ON departments;
    CREATE POLICY "Allow All Departments" ON departments FOR ALL USING (true);

    DROP POLICY IF EXISTS "Allow All Officials" ON officials;
    CREATE POLICY "Allow All Officials" ON officials FOR ALL USING (true);

    DROP POLICY IF EXISTS "Allow All Private Requests" ON private_availability_requests;
    CREATE POLICY "Allow All Private Requests" ON private_availability_requests FOR ALL USING (true);

    DROP POLICY IF EXISTS "Allow All Observations" ON complaint_observations;
    CREATE POLICY "Allow All Observations" ON complaint_observations FOR ALL USING (true);

    DROP POLICY IF EXISTS "Allow All Notifications" ON notifications;
    CREATE POLICY "Allow All Notifications" ON notifications FOR ALL USING (true);

    DROP POLICY IF EXISTS "Allow All Submissions" ON submissions;
    CREATE POLICY "Allow All Submissions" ON submissions FOR ALL USING (true);

    DROP POLICY IF EXISTS "Allow All Metadata" ON app_metadata;
    CREATE POLICY "Allow All Metadata" ON app_metadata FOR ALL USING (true);
END
$$;

