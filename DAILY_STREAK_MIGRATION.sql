-- Migration: Add daily streak and goal tracking
-- Run this in your database

-- Add primaryGoal field to User table (renamed from 'goal' to avoid conflict)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "primaryGoal" TEXT DEFAULT 'Get Employed';
-- Options: 'Get Employed', 'Get Experience'

-- Add streak tracking fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "currentStreak" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "longestStreak" INTEGER DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastStreakDate" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dailyPicksDate" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dailyPicksOpportunities" TEXT[]; -- Store IDs of today's picks

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS "User_goal_idx" ON "User"("goal");
CREATE INDEX IF NOT EXISTS "User_currentStreak_idx" ON "User"("currentStreak");
CREATE INDEX IF NOT EXISTS "User_dailyPicksDate_idx" ON "User"("dailyPicksDate");

-- OR run via Prisma:
-- npx prisma migrate dev --name add_daily_streak_system
-- npx prisma generate

