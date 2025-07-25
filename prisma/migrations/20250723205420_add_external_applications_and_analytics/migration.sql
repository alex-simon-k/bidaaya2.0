/*
  Warnings:

  - The values [PENDING] on the enum `ProjectStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `studentId` on the `Application` table. All the data in the column will be lost.
  - You are about to drop the column `age` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `educationStatus` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[projectId,userId]` on the table `Application` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeCustomerId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeSubscriptionId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Application` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProjectCategory" AS ENUM ('MARKETING', 'BUSINESS_DEVELOPMENT', 'COMPUTER_SCIENCE', 'FINANCE', 'PSYCHOLOGY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('FREE', 'ACTIVE', 'CANCELLED', 'PAST_DUE', 'UNPAID');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('FREE', 'STUDENT_PREMIUM', 'STUDENT_PRO', 'COMPANY_BASIC', 'COMPANY_PREMIUM', 'COMPANY_PRO');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExternalApplicationStatus" AS ENUM ('APPLIED', 'UNDER_REVIEW', 'PHONE_SCREEN', 'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'FINAL_ROUND', 'OFFER_RECEIVED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'NO_RESPONSE');

-- AlterEnum
BEGIN;
CREATE TYPE "ProjectStatus_new" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'LIVE', 'CLOSED', 'REJECTED');
ALTER TABLE "Project" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Project" ALTER COLUMN "status" TYPE "ProjectStatus_new" USING ("status"::text::"ProjectStatus_new");
ALTER TYPE "ProjectStatus" RENAME TO "ProjectStatus_old";
ALTER TYPE "ProjectStatus_new" RENAME TO "ProjectStatus";
DROP TYPE "ProjectStatus_old";
ALTER TABLE "Project" ALTER COLUMN "status" SET DEFAULT 'PENDING_APPROVAL';
COMMIT;

-- DropForeignKey
ALTER TABLE "Application" DROP CONSTRAINT "Application_studentId_fkey";

-- AlterTable
ALTER TABLE "Application" DROP COLUMN "studentId",
ADD COLUMN     "additionalDocument" TEXT,
ADD COLUMN     "adminNotes" TEXT,
ADD COLUMN     "compatibilityScore" DOUBLE PRECISION,
ADD COLUMN     "coverLetter" TEXT,
ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "motivation" TEXT,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "adminFeedback" TEXT,
ADD COLUMN     "applicationDeadline" TIMESTAMP(3),
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "category" "ProjectCategory",
ADD COLUMN     "compensation" TEXT,
ADD COLUMN     "currentApplications" INTEGER DEFAULT 0,
ADD COLUMN     "deliverables" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "department" TEXT,
ADD COLUMN     "duration" TEXT,
ADD COLUMN     "durationMonths" INTEGER DEFAULT 3,
ADD COLUMN     "experienceLevel" TEXT DEFAULT 'High School',
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPremium" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "learningOutcomes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "location" TEXT,
ADD COLUMN     "maxApplications" INTEGER DEFAULT 100,
ADD COLUMN     "projectType" TEXT,
ADD COLUMN     "remote" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "skillsRequired" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "subcategory" TEXT,
ADD COLUMN     "teamSize" INTEGER DEFAULT 1,
ADD COLUMN     "timeCommitment" TEXT DEFAULT 'Part-time',
ALTER COLUMN "status" SET DEFAULT 'PENDING_APPROVAL';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "age",
DROP COLUMN "educationStatus",
ADD COLUMN     "applicationsThisMonth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "applicationsThisWeek" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "calendlyLink" TEXT,
ADD COLUMN     "companyGoals" TEXT[],
ADD COLUMN     "companyOneLiner" TEXT,
ADD COLUMN     "companyRole" TEXT,
ADD COLUMN     "companyWebsite" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactPersonName" TEXT,
ADD COLUMN     "contactPersonType" TEXT,
ADD COLUMN     "contactWhatsapp" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "documentsAllowed" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "education" TEXT,
ADD COLUMN     "highSchool" TEXT,
ADD COLUMN     "interests" TEXT[],
ADD COLUMN     "lastApplicationReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastMonthlyReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "linkedin" TEXT,
ADD COLUMN     "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripeCurrentPeriodEnd" TIMESTAMP(3),
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripePriceId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT,
ADD COLUMN     "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'FREE';

-- CreateTable
CREATE TABLE "ExternalApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "jobUrl" TEXT,
    "location" TEXT,
    "salary" TEXT,
    "status" "ExternalApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "appliedDate" TIMESTAMP(3) NOT NULL,
    "followUpDate" TIMESTAMP(3),
    "notes" TEXT,
    "source" TEXT,
    "contactPerson" TEXT,
    "contactEmail" TEXT,
    "interviewDate" TIMESTAMP(3),
    "responseDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationAnalytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "bidaayaApplications" INTEGER NOT NULL DEFAULT 0,
    "externalApplications" INTEGER NOT NULL DEFAULT 0,
    "interviewsScheduled" INTEGER NOT NULL DEFAULT 0,
    "responseRate" DOUBLE PRECISION,
    "averageResponseTime" INTEGER,
    "acceptanceRate" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripePaymentId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" "PaymentStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExternalApplication_userId_appliedDate_idx" ON "ExternalApplication"("userId", "appliedDate");

-- CreateIndex
CREATE INDEX "ApplicationAnalytics_userId_date_idx" ON "ApplicationAnalytics"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationAnalytics_userId_date_key" ON "ApplicationAnalytics"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentId_key" ON "Payment"("stripePaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_projectId_userId_key" ON "Application"("projectId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalApplication" ADD CONSTRAINT "ExternalApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationAnalytics" ADD CONSTRAINT "ApplicationAnalytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
