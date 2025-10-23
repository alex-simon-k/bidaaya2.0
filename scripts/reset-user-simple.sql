-- ========================================
-- SIMPLE USER RESET (KEEPS ACCOUNT)
-- ========================================
-- This script clears all user data but keeps the account (email/password)
-- so you can test onboarding without re-signing up.
-- 
-- USAGE:
-- 1. Replace 'YOUR_USER_ID_HERE' with your actual user ID
-- 2. Run this in Supabase SQL Editor
-- ========================================

-- 🎯 REPLACE THIS WITH YOUR USER ID
DO $$
DECLARE
    target_user_id TEXT := 'YOUR_USER_ID_HERE'; -- ⬅️ PUT YOUR USER ID HERE
BEGIN
    RAISE NOTICE '🔄 Resetting user: %', target_user_id;

    -- Delete all CV-related data (CASCADE handles child tables)
    DELETE FROM "CVEducation" WHERE "userId" = target_user_id;
    DELETE FROM "CVExperience" WHERE "userId" = target_user_id;
    DELETE FROM "CVProject" WHERE "userId" = target_user_id;
    DELETE FROM "CVSkill" WHERE "userId" = target_user_id;
    DELETE FROM "CVCertification" WHERE "userId" = target_user_id;
    DELETE FROM "CVLanguage" WHERE "userId" = target_user_id;
    DELETE FROM "CVAchievement" WHERE "userId" = target_user_id;
    DELETE FROM "CVProfile" WHERE "userId" = target_user_id;
    
    -- Delete chat history (CASCADE handles messages)
    DELETE FROM "ChatConversation" WHERE "userId" = target_user_id;
    
    -- Delete applications
    DELETE FROM "Application" WHERE "userId" = target_user_id;
    DELETE FROM "ExternalApplication" WHERE "userId" = target_user_id;
    
    -- Reset user profile to fresh state
    UPDATE "User"
    SET 
        "onboardingPhase" = 'structured_chat',
        "profileCompleted" = false,
        "university" = NULL,
        "major" = NULL,
        "education" = NULL,
        "graduationYear" = NULL,
        "subjects" = NULL,
        "location" = NULL,
        "skills" = '{}',
        "interests" = '{}',
        "goal" = '{}',
        "linkedin" = NULL,
        "github" = NULL,
        "dateOfBirth" = NULL,
        "highSchool" = NULL,
        "gapYear" = NULL,
        "gapYearActivity" = NULL,
        "updatedAt" = NOW()
    WHERE "id" = target_user_id;
    
    RAISE NOTICE '✅ User reset complete!';
    RAISE NOTICE '🚀 User can now test onboarding from Phase 1';
END $$;

