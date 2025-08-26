-- Auto-generated migration to add missing CSV fields

-- Add missing fields to ApplicationAnalytics
ALTER TABLE "ApplicationAnalytics" 
  ADD COLUMN "date:createdAt" TIMESTAMP;

