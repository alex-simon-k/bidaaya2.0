-- ========================================
-- DELETE USER COMPLETELY
-- ========================================
-- This script DELETES the entire user record and all related data.
-- 
-- USAGE:
-- 1. Replace 'YOUR_USER_ID_HERE' with your actual user ID
-- 2. Run this entire script in Supabase SQL Editor
-- 3. User will be completely removed - they can sign up again as a fresh user
--
-- ⚠️  WARNING: This is PERMANENT deletion!
-- ========================================

-- 🎯 REPLACE THIS WITH YOUR USER ID
DO $$
DECLARE
    target_user_id TEXT := 'YOUR_USER_ID_HERE'; -- ⬅️ PUT YOUR USER ID HERE
BEGIN
    RAISE NOTICE '🗑️  Deleting user: %', target_user_id;

    -- Delete in order to avoid foreign key violations
    
    -- 1. Chat system (messages reference conversations)
    DELETE FROM "ChatMessage" WHERE "userId" = target_user_id;
    DELETE FROM "ChatConversation" WHERE "userId" = target_user_id;
    RAISE NOTICE '✅ Deleted chat data';
    
    -- 2. CV system (impacts reference experiences/projects)
    DELETE FROM "CVExperienceImpact" WHERE "experienceId" IN (SELECT id FROM "CVExperience" WHERE "userId" = target_user_id);
    DELETE FROM "CVProjectImpact" WHERE "projectId" IN (SELECT id FROM "CVProject" WHERE "userId" = target_user_id);
    DELETE FROM "CVEducation" WHERE "userId" = target_user_id;
    DELETE FROM "CVExperience" WHERE "userId" = target_user_id;
    DELETE FROM "CVProject" WHERE "userId" = target_user_id;
    DELETE FROM "CVSkill" WHERE "userId" = target_user_id;
    DELETE FROM "CVCertification" WHERE "userId" = target_user_id;
    DELETE FROM "CVLanguage" WHERE "userId" = target_user_id;
    DELETE FROM "CVAchievement" WHERE "userId" = target_user_id;
    DELETE FROM "CVProfile" WHERE "userId" = target_user_id;
    RAISE NOTICE '✅ Deleted CV data';
    
    -- 3. Applications
    DELETE FROM "Application" WHERE "userId" = target_user_id;
    DELETE FROM "ExternalApplication" WHERE "userId" = target_user_id;
    DELETE FROM "ExternalOpportunityApplication" WHERE "userId" = target_user_id;
    RAISE NOTICE '✅ Deleted applications';
    
    -- 4. Other user data
    DELETE FROM "ApplicationSession" WHERE "userId" = target_user_id;
    DELETE FROM "ApplicationAnalytics" WHERE "userId" = target_user_id;
    DELETE FROM "ChatQuery" WHERE "userId" = target_user_id;
    DELETE FROM "BehavioralInsight" WHERE "userId" = target_user_id;
    DELETE FROM "AIMatch" WHERE "studentId" = target_user_id;
    DELETE FROM "StudentTag" WHERE "userId" = target_user_id;
    DELETE FROM "StudentVector" WHERE "userId" = target_user_id;
    DELETE FROM "EarlyAccessUnlock" WHERE "userId" = target_user_id;
    DELETE FROM "OpportunityFeedback" WHERE "userId" = target_user_id;
    DELETE FROM "CreditTransaction" WHERE "userId" = target_user_id;
    DELETE FROM "PageView" WHERE "userId" = target_user_id;
    DELETE FROM "UserSession" WHERE "userId" = target_user_id;
    DELETE FROM "Payment" WHERE "userId" = target_user_id;
    RAISE NOTICE '✅ Deleted analytics and tracking data';
    
    -- 5. Auth tables
    DELETE FROM "Session" WHERE "userId" = target_user_id;
    DELETE FROM "Account" WHERE "userId" = target_user_id;
    RAISE NOTICE '✅ Deleted auth sessions';
    
    -- 6. Finally, delete the user
    DELETE FROM "User" WHERE id = target_user_id;
    RAISE NOTICE '✅ Deleted user record';
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ==========================================';
    RAISE NOTICE '🎉 USER COMPLETELY DELETED!';
    RAISE NOTICE '🎉 You can now sign up again as a fresh user';
    RAISE NOTICE '🎉 ==========================================';
    
END $$;

