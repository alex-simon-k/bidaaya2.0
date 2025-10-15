-- AlterTable
ALTER TABLE "ChatConversation" ADD COLUMN IF NOT EXISTS "conversationLevel" INTEGER DEFAULT 1;

