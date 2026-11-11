# JANASUVIDHA — AI-Powered Multilingual Hospital Grievance & Resolution Platform

> **Tagline:** Every Voice Matters. Every Complaint Counts.  
> Designed for Government Hospitals across India (Pilot: Outpatient Department, Ballari).

---

## 🌟 Overview

**JANASUVIDHA** is a production-grade, full-stack, multilingual hospital grievance reporting and resolution platform. It allows citizens — especially rural patients, the elderly, and individuals with limited digital literacy — to report hospital facility issues by simply speaking in **Kannada**, **Hindi**, or **English**.

The system translates regional complaints in real time, automatically triages and categorizes grievances using AI, routes them to specific ground officials, mandates Before/After photo evidence, requires supervisor physical inspection sign-offs, and provides live public tracking without exposing any citizen personal identifying information (PII).

---

## 🚀 Key Features

### 1. Citizen Portal (`/citizen`)
- **Multilingual Voice-First Registration:** Large, accessible microphone interface with listening animations. Native support for Kannada (`ಕನ್ನಡ`), Hindi (`हिन्दी`), and English.
- **AI Triage & Translation:** Converts regional speech to English for administration while preserving original spoken audio transcript.
- **Public Issue Board:** Real-time visibility into shared hospital facility concerns (dirty washrooms, broken water coolers, elevator faults). Zero patient names or phone numbers exposed.
- **Duplicate Detection & Recurrence Incrementing:** Intelligently recognizes previously logged issues in the vicinity and allows citizens to confirm/upvote rather than create clutter.
- **Private Medicine Tracking via Mobile OTP:** SMS notification workflow for out-of-stock pharmacy medications.
- **Citizen Feedback & Reopen:** Star ratings (1-5) and ability to reopen tickets if an issue was not genuinely resolved.

### 2. Department Official Portal (`/official`)
- **Operational Role-based Workspace:** Tailored for Sanitation Inspectors, Water & Plumbing Officers, Chief Pharmacists, Bed Management Officers, and Infrastructure Engineers.
- **Grievance Lifecycle Workflow:**
  1. Open assigned task
  2. Accept & mark **IN PROGRESS**
  3. Upload mandatory **BEFORE Photo**
  4. Perform ground corrective action
  5. Upload mandatory **AFTER Photo**
  6. Submit for Supervisor Verification
- **Evidence Gallery:** Searchable catalog of timestamped before/after photographic proof.

### 3. Hospital Administration Portal (`/admin`)
- **Executive Command Center:** For Medical Superintendents and District Health Officers.
- **KPI Dashboards:** Total Complaints, Verified Solved, Active Pending, SLA Overdue, Average Resolution Time (2.4h), and Citizen Satisfaction Score (4.8/5.0).
- **Interactive Recharts Analytics:**
  - 7-Day Complaint Inflow vs. Verified Resolutions Area Chart
  - Grievance Category Distribution Donut Chart
  - Turnaround Times and Performance by Department Bar Charts
- **Hotspot Zone Preventive Alerting:** Automatic identification of wards with repeated recurring failures.
- **SLA Escalation Center:** Level 1, 2, and 3 alerts for overdue issues with one-click executive notice dispatch.
- **Audit Reports & One-Click CSV Export:** Export complete historical compliance logs for State Health Directorate reviews.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS with Custom Government Healthcare Palette
- **Components & Icons:** Lucide React, Shadcn/ui architecture patterns
- **Analytics:** Recharts
- **Forms & Validation:** React Hook Form + Zod
- **ORM & Database:** Prisma ORM with PostgreSQL-ready schema
- **AI & NLP:** Gemini / OpenAI / Bhashini Translation Service with resilient heuristic fallback
- **Authentication:** Role-based session tokens with zero secret leakage to client

---

## 🎨 Color Palette

| Token | Hex | Usage |
|---|---|---|
| **Deep Teal** | `#12343B` | Primary headings, top Govt bar, dark banners |
| **Primary Teal** | `#147D78` | Action buttons, brand accent, active state |
| **Soft Mint** | `#E8F4F1` | Pill tags, selected chips, subtle hero gradient |
| **Background** | `#F5F8F7` | Neutral modern page background |
| **Main Text** | `#263238` | High-contrast readable typography |
| **Muted Text** | `#607477` | Secondary descriptions, timestamps |
| **Card White** | `#FFFFFF` | Rounded cards, modals |

---

## 📂 Project Architecture

```
app/
├── (public)/
│   ├── page.tsx               # Main landing page with hero, kiosks & portal cards
│   ├── how-it-works/page.tsx  # Step-by-step citizen & official guide
│   └── about/page.tsx         # Platform mission & technical blueprint
├── citizen/
│   ├── page.tsx               # Touch-friendly welcome & kiosk screen
│   ├── voice/page.tsx         # Voice grievance recording & AI triage simulator
│   ├── report/page.tsx        # Standard complaint registration form
│   ├── issues/page.tsx        # Public hospital issue board (Anonymized)
│   ├── track/page.tsx         # Ticket tracking, timeline & citizen feedback
│   └── otp/page.tsx           # Private medicine restock SMS alert workflow
├── official/
│   ├── login/page.tsx         # Fast officer demo switch & credentials login
│   ├── dashboard/page.tsx     # Queue, status metrics & fast actions
│   ├── complaints/[id]/       # Full 10-step resolution & Before/After photo proof
│   ├── evidence/page.tsx      # Photographic inspection gallery
│   └── analytics/page.tsx     # Department performance & turnaround times
├── admin/
│   ├── login/page.tsx         # Administrator sign-in
│   ├── dashboard/page.tsx     # Executive command center with Recharts KPIs
│   ├── departments/page.tsx   # Operational departments & staff load
│   ├── officials/page.tsx     # Staff duty roster & supervisor privileges
│   ├── escalations/page.tsx   # SLA breach escalation center
│   ├── reports/page.tsx       # Audit compliance & working CSV export
│   └── settings/page.tsx      # SLA thresholds & policy config
└── api/
    ├── complaints/            # CRUD & filter API
    ├── complaints/[id]/       # Status update & supervisor sign-off
    ├── complaints/[id]/upvote # Recurrence counter & auto-escalation
    ├── complaints/[id]/feedback # Citizen 1-5 star ratings & reopen
    ├── ai/classify/           # AI categorization & priority triage
    ├── ai/translate/          # Regional Kannada/Hindi translation
    ├── otp/send/              # SMS OTP dispatch (simulated/live)
    └── otp/verify/            # 6-digit OTP verification & rate-limiting

components/
├── shared/
│   ├── Navbar.tsx             # Responsive nav with Govt banner & language switcher
│   ├── Footer.tsx             # Privacy guarantee & helpline footer
│   ├── LanguageSwitcher.tsx   # English, Kannada, Hindi selector
│   ├── StatusBadge.tsx        # Styled status badges
│   └── PriorityBadge.tsx      # Color-coded severity chips

lib/
├── config/env.ts              # Zod environment variable validation
├── services/
│   ├── ai.service.ts          # AI triage, duplicate detection & priority
│   ├── speech.service.ts      # Web Speech API & voice prompts
│   ├── translation.service.ts # Medical Kannada/Hindi translation engine
│   ├── otp.service.ts         # Secure OTP generation & rate limiting
│   ├── notification.service.ts# SMS notification dispatch adapter
│   ├── storage.service.ts     # Evidence photo upload service
│   └── complaint.service.ts   # Core business logic & state machine
└── mock-data.ts               # Realistic initial seed data for Outpatient Department, Ballari

prisma/
└── schema.prisma              # Complete PostgreSQL database schema
```

---

## ⚡ Quick Start & Run Commands

### 1. Installation
```bash
npm install
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Build Production Artifact
```bash
npm run build
```

### 4. Start Production Server
```bash
npm start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

The application runs seamlessly in **Demo Mode** (`NEXT_PUBLIC_DEMO_MODE=true`) out of the box without requiring external API keys. When live keys are provided in `.env.local`, the services seamlessly switch to live third-party providers:

- **AI_API_KEY**: Google Gemini / OpenAI key for live NLP triage.
- **SMS_API_KEY**: Fast2SMS / Twilio credentials for live SMS dispatch.
- **SPEECH_API_KEY**: Bhashini / Whisper endpoint for cloud ASR.
- **DATABASE_URL**: PostgreSQL connection string.

