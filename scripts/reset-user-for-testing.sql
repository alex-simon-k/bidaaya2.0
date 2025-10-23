-- ========================================
-- RESET USER DATA FOR TESTING
-- ========================================
-- This script completely clears a user's data so you can test onboarding flows from scratch
-- 
-- USAGE:
-- 1. Replace 'YOUR_USER_ID_HERE' with the actual user ID
-- 2. Run this entire script in Supabase SQL Editor
-- 3. User will be reset to fresh state (like they just signed up)
--
-- SAFE: Only deletes data for the specified user, doesn't affect other users
-- ========================================

-- 🎯 REPLACE THIS WITH YOUR USER ID
DO $$
DECLARE
    target_user_id TEXT := 'YOUR_USER_ID_HERE'; -- ⬅️ PUT YOUR USER ID HERE
BEGIN
    RAISE NOTICE '🔄 Starting user reset for: %', target_user_id;

    -- ========================================
    -- 1. DELETE CV DATA
    -- ========================================
    
    -- Delete Education entries
    DELETE FROM "CVEducation" WHERE "userId" = target_user_id;
    RAISE NOTICE '✅ Deleted CVEducation entries';
    
    -- Delete Work Experience entries (impacts will cascade)
    DELETE FROM "CVExperience" WHERE "userId" = target_user_id;
    RAISE NOTICE '✅ Deleted CVExperience entries';
    
    -- Delete Projects (impacts will cascade)
    DELETE FROM "CVProject" WHERE "userId" = target_user_id;
    RAISE NOTICE '✅ Deleted CVProject entries';
    
    -- Delete CV Profile
    DELETE FROM "CVProfile" WHERE "userId" = target_user_id;
    RAISE NOTICE '✅ Deleted CVProfile entries';
    
    -- Delete Achievements
    DELETE FROM "CVAchievement" WHERE "userId" = target_user_id;
    RAISE NOTICE '✅ Deleted CVAchievement entries';
    
    -- Delete Skills
    DELETE FROM "CVSkill" WHERE "userId" = target_user_id;
    RAISE NOTICE '✅ Deleted CVSkill entries';
    
    -- Delete Certifications
    DELETE FROM "CVCertification" WHERE "userId" = target_user_id;
    RAISE NOTICE '✅ Deleted CVCertification entries';
    
    -- Delete Languages
    DELETE FROM "CVLanguage" WHERE "userId" = target_user_id;
    RAISE NOTICE '✅ Deleted CVLanguage entries';

    -- ========================================
    -- 2. DELETE CHAT HISTORY
    -- ========================================
    
    -- Delete Chat Messages (cascade will handle this, but explicit for clarity)
    DELETE FROM "ChatMessage" WHERE "userId" = target_user_id;
    RAISE NOTICE '✅ Deleted ChatMessage entries';
    
    -- Delete Conversations
    DELETE FROM "ChatConversation" WHERE "userId" = target_user_id;
    RAISE NOTICE '✅ Deleted ChatConversation entries';

    -- ========================================
    -- 3. DELETE APPLICATIONS
    -- ========================================
    
    -- Delete Applications to projects
    DELETE FROM "Application" WHERE "userId" = target_user_id;
    RAISE NOTICE '✅ Deleted Application entries';
    
    -- Delete External Applications
    DELETE FROM "ExternalApplication" WHERE "userId" = target_user_id;
    RAISE NOTICE '✅ Deleted ExternalApplication entries';

    -- ========================================
    -- 4. RESET USER PROFILE FIELDS
    -- ========================================
    
    -- Reset onboarding and profile completion
    UPDATE "User"
    SET 
        "onboardingPhase" = 'structured_chat',
        "profileCompleted" = false,
        "profileCompleteness" = 0,
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
        "portfolio" = NULL,
        "dateOfBirth" = NULL,
        "highSchool" = NULL,
        "gapYear" = NULL,
        "gapYearActivity" = NULL,
        "updatedAt" = NOW()
    WHERE "id" = target_user_id;
    
    RAISE NOTICE '✅ Reset User profile fields';

    -- ========================================
    -- 5. VERIFY RESET
    -- ========================================
    
    RAISE NOTICE '🎉 ==========================================';
    RAISE NOTICE '🎉 USER RESET COMPLETE!';
    RAISE NOTICE '🎉 User ID: %', target_user_id;
    RAISE NOTICE '🎉 ==========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Verification:';
    RAISE NOTICE '   - onboardingPhase: structured_chat (Phase 1)';
    RAISE NOTICE '   - profileCompleted: false';
    RAISE NOTICE '   - All CV data: cleared';
    RAISE NOTICE '   - All chat history: cleared';
    RAISE NOTICE '   - All applications: cleared';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 User is ready to test onboarding flow from scratch!';
    
END $$;


-- ========================================
-- QUICK VERIFICATION QUERY
-- ========================================
-- Run this after the reset to verify everything is cleared
-- (Replace YOUR_USER_ID_HERE with your actual user ID)

SELECT 
    u.id,
    u.name,
    u.email,
    u."onboardingPhase",
    u."profileCompleted",
    (SELECT COUNT(*) FROM "CVEducation" WHERE "userId" = u.id) as education_count,
    (SELECT COUNT(*) FROM "CVExperience" WHERE "userId" = u.id) as experience_count,
    (SELECT COUNT(*) FROM "CVProject" WHERE "userId" = u.id) as project_count,
    (SELECT COUNT(*) FROM "CVSkill" WHERE "userId" = u.id) as skill_count,
    (SELECT COUNT(*) FROM "ChatConversation" WHERE "userId" = u.id) as conversation_count,
    (SELECT COUNT(*) FROM "Application" WHERE "userId" = u.id) as application_count
FROM "User" u
WHERE u.id = 'YOUR_USER_ID_HERE'; -- ⬅️ PUT YOUR USER ID HERE

