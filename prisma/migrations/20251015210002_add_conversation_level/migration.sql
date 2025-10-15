-- AlterTable
ALTER TABLE "ChatConversation" ADD COLUMN IF NOT EXISTS "conversationLevel" INTEGER NOT NULL DEFAULT 1;

