-- Migration: Add CVEnhancement table for custom CV question-answer storage
-- Run this in your database before deploying

CREATE TABLE "CVEnhancement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "opportunityId" TEXT,
    "category" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "relevantFor" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CVEnhancement_pkey" PRIMARY KEY ("id")
);

-- Create indexes for better query performance
CREATE INDEX "CVEnhancement_userId_idx" ON "CVEnhancement"("userId");
CREATE INDEX "CVEnhancement_category_idx" ON "CVEnhancement"("category");
CREATE INDEX "CVEnhancement_relevantFor_idx" ON "CVEnhancement"("relevantFor");

-- Add foreign key constraint
ALTER TABLE "CVEnhancement" ADD CONSTRAINT "CVEnhancement_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- OR run this if you prefer Prisma CLI:
-- npx prisma migrate dev --name add_cv_enhancement
-- npx prisma generate

