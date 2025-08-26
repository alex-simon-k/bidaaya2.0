-- Add missing columns to User table to match CSV
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionPlan" TEXT DEFAULT 'FREE';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT DEFAULT 'ACTIVE';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileCompleted" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileCompletedAt" TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstApplicationAt" TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "linkedin" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "contactWhatsapp" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "onboardingStepsCompleted" TEXT[];
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phase1CompletedAt" TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phase2CompletedAt" TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "education" TEXT;

-- Add missing columns to Application table to match CSV
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "motivation" TEXT;

-- Create ApplicationAnalytics table if it doesn't exist
CREATE TABLE IF NOT EXISTS "ApplicationAnalytics" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "date" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "bidaayaApplications" INTEGER DEFAULT 0,
  "externalApplications" INTEGER DEFAULT 0,
  "interviewsScheduled" INTEGER DEFAULT 0,
  FOREIGN KEY ("userId") REFERENCES "User"("id")
);

-- Create ApplicationSession table if it doesn't exist
CREATE TABLE IF NOT EXISTS "ApplicationSession" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "sessionId" TEXT UNIQUE NOT NULL,
  "startedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "completedAt" TIMESTAMP,
  "abandonedAt" TIMESTAMP,
  "timeSpentMinutes" INTEGER,
  "stepReached" INTEGER DEFAULT 1,
  "status" TEXT DEFAULT 'IN_PROGRESS',
  "step1Completed" BOOLEAN DEFAULT false,
  "step2Completed" BOOLEAN DEFAULT false,
  "step3Completed" BOOLEAN DEFAULT false,
  "step4Completed" BOOLEAN DEFAULT false,
  "wasSaved" BOOLEAN DEFAULT false,
  "wasRestored" BOOLEAN DEFAULT false,
  "saveCount" INTEGER DEFAULT 0,
  "deviceType" TEXT,
  "browserInfo" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY ("userId") REFERENCES "User"("id"),
  FOREIGN KEY ("projectId") REFERENCES "Project"("id")
);

-- Add missing columns to Project table
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "description" TEXT DEFAULT '';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "ApplicationAnalytics_userId_idx" ON "ApplicationAnalytics"("userId");
CREATE INDEX IF NOT EXISTS "ApplicationSession_userId_idx" ON "ApplicationSession"("userId");
CREATE INDEX IF NOT EXISTS "ApplicationSession_projectId_idx" ON "ApplicationSession"("projectId");
